import os
import sys
import torch
import numpy as np
import pydicom
import base64
import zlib
import nibabel as nib
import medim
import torch.nn.functional as F
from .geometry import get_affine_matrix, pixel_to_patient

# Add SAM-Med3D to path
SAM_PATH = r'c:\Users\MSI\SAM-Med3D'
if SAM_PATH not in sys.path:
    sys.path.append(SAM_PATH)

from segment_anything.build_sam3D import sam_model_registry3D

def _log(msg):
    with open(r'c:\Users\MSI\Desktop\cerebro\ai_debug.log', 'a') as f:
        f.write(str(msg) + '\n')

# Global Model Cache
_MODEL_CACHE = {}

def get_sam_model():
    if 'model' not in _MODEL_CACHE:
        # 1. Build architecture without checkpoint first to avoid nested loading issues
        # Force prompt_embed_dim=384 for turbo checkpoint
        model = sam_model_registry3D['vit_b'](checkpoint=None, prompt_embed_dim=384)
        
        # 2. Manual mapping of the nested state_dict
        checkpoint_path = os.path.join(SAM_PATH, 'ckpt', 'sam_med3d_turbo.pth')
        state_dict = torch.load(checkpoint_path, map_location='cpu')
        
        # Determine the source state_dict
        sd = state_dict['model_state_dict'] if 'model_state_dict' in state_dict else state_dict
        
        # CRITICAL: Purge any buffer that could cause rank mismatch [3,1,1] vs [3,1,1,1]
        keys = list(sd.keys())
        for k in keys:
            if 'pixel_mean' in k or 'pixel_std' in k:
                del sd[k]

        # Load with strict=False to skip purged buffers
        model.load_state_dict(sd, strict=False) 

        # CRITICAL: Override pixel_mean/pixel_std to be 1-channel.
        # build_sam3D.py initializes them with 3 values, giving shape (3,1,1,1).
        # sam3D.preprocess() does x - pixel_mean, which broadcasts a 1-chan tensor
        # to 3 channels, causing the Conv3D "expected 1 channel, got 3" error.
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        model.register_buffer('pixel_mean', torch.tensor([123.675], device=device).view(-1, 1, 1, 1), False)
        model.register_buffer('pixel_std', torch.tensor([58.395], device=device).view(-1, 1, 1, 1), False)

        model.to(device)
        model.eval()
        _MODEL_CACHE['model'] = model
        _MODEL_CACHE['device'] = device
    return _MODEL_CACHE['model'], _MODEL_CACHE['device']

def run_segment_all(study, series_id, slice_idx, click_x, click_y, canvas_width, canvas_height, all_series_data):
    _log(f"--- START SEGMENTATION ---")
    _log(f"Input: series_id={series_id}, slice_idx={slice_idx}, click=({click_x}, {click_y}), canvas={canvas_width}x{canvas_height}")
    
    model, device = get_sam_model()
    
    # --- Step 1: Find Seed in Patient space ---
    if series_id not in all_series_data:
        _log(f"ERROR: series_id {series_id} not found in all_series_data")
        return {}
        
    target_series = all_series_data[series_id]
    series_number = target_series.get('number', 'UNK')
    _log(f"Mapping: SUID {series_id} -> SeriesNumber {series_number}")

    folder_path = study.local_folder_path
    seed_dicom_path = os.path.join(folder_path, target_series['files'][slice_idx])
    _log(f"Seed DICOM: {seed_dicom_path}")
    
    ds_seed = pydicom.dcmread(seed_dicom_path)
    
    # Scale click coordinates from Canvas down to actual DICOM dimensions
    vol_w, vol_h = ds_seed.Columns, ds_seed.Rows
    print(f"DEBUG: Canvas size received: {canvas_width} x {canvas_height}")
    print(f"DEBUG: Click received: x={click_x}, y={click_y}, slice={slice_idx}")

    if canvas_width and canvas_height and canvas_width > 0 and canvas_height > 0:
        scaled_x = int((click_x / canvas_width) * vol_w)
        scaled_y = int((click_y / canvas_height) * vol_h)
        _log(f"Scaled Click: ({click_x}, {click_y}) on {canvas_width}x{canvas_height} -> ({scaled_x}, {scaled_y}) on {vol_w}x{vol_h}")
        click_x, click_y = scaled_x, scaled_y
        print(f"DEBUG: Initial click mapping (to DICOM pixels): x={scaled_x}, y={scaled_y}, raw_slice={slice_idx}")
        
    point_patient = pixel_to_patient(click_y, click_x, ds_seed) # (x,y,z) in mm
    _log(f"Seed Patient Space: {point_patient}")
    
    results = {}
    
    # Check for existing NIfTI in media/volumes/
    nifti_dir = r'c:\Users\MSI\Desktop\cerebro\media\volumes'
    
    for sid, sdata in all_series_data.items():
        if sid != series_id:
            _log(f"Skipping series {sid} (Focusing single series only)")
            continue
        try:
            # --- VOLUME LOADING ---
            s_folder = sdata.get('folder', '')
            import re
            m = re.search(r'SE(\d+)', s_folder)
            nifti_idx = int(m.group(1)) if m else None
            nifti_path = os.path.join(nifti_dir, f"series_{nifti_idx}.nii.gz") if nifti_idx else ""

            img = None
            nifti_loaded = False
            if nifti_path and os.path.exists(nifti_path):
                img = nib.load(nifti_path)
                if not np.allclose(img.affine, np.eye(4)):
                    _log(f"Loading NIfTI from {nifti_path}")
                    volume = img.get_fdata()
                    if volume.shape[-1] < volume.shape[0] and volume.shape[-1] < volume.shape[1]:
                        volume = volume.transpose(2, 0, 1)
                    _, _, v_ipp_list = _load_volume(folder_path, sdata['files'], normalize=False)
                    nifti_loaded = True
                else:
                    _log(f"NIfTI {nifti_path} has Identity affine. Falling back to DICOM.")

            if not nifti_loaded:
                _log(f"Building volume from DICOM for series {sid}")
                volume, _, v_ipp_list = _load_volume(folder_path, sdata['files'], normalize=False)
                _log(f"DICOM Volume Shape: {volume.shape}")
                
                # Ensure we have a NIfTI path for medim.segment
                if not nifti_path:
                    nifti_path = os.path.join(nifti_dir, f"temp_{sid}.nii.gz")
                
                if not os.path.exists(nifti_path):
                    _log(f"Saving temporary NIfTI for medim: {nifti_path}")
                    os.makedirs(nifti_dir, exist_ok=True)
                    # Use identity affine for temp conversion; medim handles internal scaling
                    ni_img = nib.Nifti1Image(volume, np.eye(4))
                    nib.save(ni_img, nifti_path)
            
            # --- SEED MAPPING ---
            # FIX #1: Use first file of THIS series as reference for its own normal vector
            ds_series_ref = pydicom.dcmread(os.path.join(folder_path, sdata['files'][0]), stop_before_pixels=True)
            v_seed_idx = _find_closest_slice(point_patient, v_ipp_list, ds_ref=ds_series_ref)
            if v_seed_idx is None:
                continue
            
            # Determine pixel coordinates in the target volume
            if nifti_loaded and img is not None:
                from .geometry import patient_to_pixel_nifti
                v_seed_vox = patient_to_pixel_nifti(point_patient, img.affine, volume.shape)
                _log(f"Using Affine Transform: {v_seed_vox}")
            else:
                ds_v = pydicom.dcmread(os.path.join(folder_path, sdata['files'][v_seed_idx]))
                from .geometry import patient_to_pixel
                result = patient_to_pixel(point_patient, ds_v, volume.shape[1], volume.shape[2])
                if result is None:
                    _log(f"Series {sid}: Point projects outside image bounds. Skipping.")
                    continue
                v_row, v_col = result
                v_seed_vox = [v_seed_idx, v_row, v_col]
                _log(f"Series {sid} Click Mapping: Slice idx {v_seed_idx}, Pixel ({v_row}, {v_col})")
            
            # --- INFERENCE ---
            # medim.segment handles normalization, resizing, and coordinate scaling internally
            # It expects voxel coordinates [Z, Y, X] or similar; based on user snippet, we pass scaled.
            # Using v_seed_vox calculated earlier (raw DICOM indices)
            mask_3d, iou_score = _infer_sam3d(model, device, nifti_path, v_seed_vox[0], v_seed_vox[1], v_seed_vox[2])
            
            non_zero = np.count_nonzero(mask_3d)
            _log(f"Inference Done for {sid}: {non_zero} pixels detected")
            
            if non_zero < 10:
                _log(f"WARNING: Mask for {sid} is almost empty. Skipping.")
                continue
            
            mask_bytes = mask_3d.astype(np.uint8).tobytes()
            compressed = base64.b64encode(zlib.compress(mask_bytes)).decode('utf-8')
            results[sid] = {
                'mask': compressed,
                'shape': list(mask_3d.shape),
                'confidence': float(iou_score)
            }
        except Exception as e:
            import traceback
            _log(f"EXCEPTION segmenting series {sid}: {e}\n{traceback.format_exc()}")
            continue
            
    return results

def _load_volume(folder_path, dcm_files, normalize=True):
    """Load DICOM files into a 3D numpy volume.
    
    Forces grayscale: if any slice has shape (H, W, 3) (RGB DICOM), it is
    collapsed to (H, W) via luminance average before stacking.
    """
    slices = []
    ipp_list = []
    for f in dcm_files:
        ds = pydicom.dcmread(os.path.join(folder_path, f))
        arr = ds.pixel_array
        # Collapse RGB/multi-channel to grayscale
        if arr.ndim == 3 and arr.shape[-1] in (3, 4):
            arr = arr[..., :3].mean(axis=-1)
        slices.append(arr)
        ipp_list.append(getattr(ds, 'ImagePositionPatient', [0, 0, 0]))
    
    volume = np.stack(slices)
    if normalize:
        volume = (volume - volume.min()) / (volume.max() - volume.min() + 1e-8) * 255.0
    return volume, None, ipp_list

def patient_to_pixel_nifti(point_patient, affine, shape):
    """Convert patient coordinates (mm) to voxel coordinates using affine."""
    inv_affine = np.linalg.inv(affine)
    point_vox = np.dot(inv_affine, np.append(point_patient, 1.0))
    return point_vox[:3]

def _find_closest_slice(point_mm, ipp_list, ds_ref=None):
    """Find the index of the slice closest to the patient coordinate along the slice normal.
    
    FIX #2: Use each series' own normal vector (ds_ref must be from the target series),
    and compute an adaptive threshold based on the volume's depth extent instead of
    a hard 5mm limit.
    """
    if not ipp_list: return None
    
    # Calculate Normal Vector from the TARGET SERIES' own orientation
    if ds_ref:
        iop = getattr(ds_ref, 'ImageOrientationPatient', [1, 0, 0, 0, 1, 0])
        x_orient = np.array(iop[:3])
        y_orient = np.array(iop[3:])
        normal = np.cross(x_orient, y_orient)
    else:
        normal = np.array([0, 0, 1])
    
    normal_len = np.linalg.norm(normal)
    if normal_len < 1e-6:
        normal = np.array([0, 0, 1])
    else:
        normal = normal / normal_len
        
    point_mm = np.array(point_mm)
    point_depth = np.dot(point_mm, normal)
    slice_depths = [np.dot(np.array(ipp), normal) for ipp in ipp_list]
    
    dists = [abs(point_depth - sd) for sd in slice_depths]
    min_idx = np.argmin(dists)
    min_dist = dists[min_idx]
    
    # Adaptive threshold: half the volume's depth extent, minimum 10mm
    vol_extent = abs(max(slice_depths) - min(slice_depths)) if len(slice_depths) > 1 else 10.0
    threshold = max(vol_extent * 0.6, 10.0)
    
    _log(f"Depth Audit: Point {point_depth:.2f}, Min Slice {slice_depths[min_idx]:.2f}, Diff {min_dist:.2f}mm, Threshold {threshold:.1f}mm")
    
    if min_dist > threshold:
        _log(f"SKIPPING: Depth Diff {min_dist:.2f}mm > threshold {threshold:.1f}mm")
        return None
    return min_idx

def _infer_sam3d(model, device, nifti_path, d, h, w):
    """Run SAM-Med3D inference using the medim library."""
    # Scale coordinates to the 128-grid as medim might expect them scaled or handle them
    # Based on the user's working Colab snippet, we provide [[x, y, z]]
    
    # We need the original volume shape for scaling
    img = nib.load(nifti_path)
    orig_shape = img.shape # (H, W, D) usually, or (D, H, W)
    
    # Coordinate alignment check: NIfTI voxel vs DICOM voxel
    # For now, following exactly what worked for the user:
    # scaled_x = (x / width) * 128, etc.
    sz = (float(d) / orig_shape[0]) * 128.0
    sy = (float(h) / orig_shape[1]) * 128.0
    sx = (float(w) / orig_shape[2]) * 128.0
    
    _log(f"medim.segment call on {nifti_path} with scaled point [{sx:.2f}, {sy:.2f}, {sz:.2f}]")
    
    # User's provided snippet:
    result = medim.segment(
        model=model,
        image_path=nifti_path,
        point_prompt=[[sx, sy, sz]],
        point_label=[1]
    )
    
    return result['mask'], result['iou']
