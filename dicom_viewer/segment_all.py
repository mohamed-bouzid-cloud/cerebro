import os
import sys
import torch
import numpy as np
import pydicom
import nibabel as nib
import torch.nn.functional as F
import medim
from .geometry import pixel_to_patient

# Add SAM-Med3D to path
SAM_PATH = r'c:\Users\MSI\SAM-Med3D'
if SAM_PATH not in sys.path:
    sys.path.append(SAM_PATH)

from segment_anything.build_sam3D import sam_model_registry3D

def _log(msg):
    log_path = r'c:\Users\MSI\Desktop\cerebro\ai_debug.log'
    with open(log_path, 'a') as f:
        f.write(f"[CLINICAL RESTORATION] {msg}\n")

# Global Model Cache for speed
_MODEL_CACHE = {}

def get_sam_model():
    checkpoint_path = os.path.join(SAM_PATH, 'ckpt', 'sam_med3d_turbo.pth')
    if 'model' not in _MODEL_CACHE:
        _log(f"Initializing Official MedIM Model (Turbo-Spec) from {checkpoint_path}")
        # Build manually to ensure 384-dim parity
        model = sam_model_registry3D['vit_b'](checkpoint=None, prompt_embed_dim=384)
        sd = torch.load(checkpoint_path, map_location='cpu')
        if 'model_state_dict' in sd: sd = sd['model_state_dict']
        model.load_state_dict(sd, strict=False)
        
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        model.to(device).eval()
        _MODEL_CACHE['model'] = model
        _MODEL_CACHE['device'] = device
    return _MODEL_CACHE['model'], _MODEL_CACHE['device']

def _load_volume_sorted(folder_path, dcm_files):
    """Surgical Loader: Sorts by Physical Z-position and calculates REAL SPACING."""
    meta = []
    for i, f in enumerate(dcm_files):
        try:
            ds = pydicom.dcmread(os.path.join(folder_path, f))
            z_pos = float(ds.ImagePositionPatient[2])
            meta.append({'z': z_pos, 'ds': ds, 'orig_idx': i})
        except Exception as e:
            _log(f"Warning: Slice read error {f}: {e}")
            
    # Sort Z (Physical Min-to-Max)
    meta.sort(key=lambda x: x['z'])
    
    # Removed manual flipping. AI should process data exactly as loaded on frontend.
    slices = [m['ds'].pixel_array for m in meta] 
    orig_indices = [m['orig_idx'] for m in meta]
    vol = np.stack(slices)
    
    # NEW Head IPP as World Origin
    first_ipp = np.array(meta[0]['ds'].ImagePositionPatient)
    
    ds_ref = meta[0]['ds']
    # FALLBACK: If SliceThickness is missing, use Z-diff from first two slices
    dz = getattr(ds_ref, 'SliceThickness', None)
    if dz is None or dz == 0:
        if len(meta) > 1:
            dz = abs(meta[1]['z'] - meta[0]['z'])
        else:
            dz = 1.0 
            
    spacing = [
        float(dz), # [0] -> Z
        float(ds_ref.PixelSpacing[1]), # [1] -> X
        float(ds_ref.PixelSpacing[0])  # [2] -> Y
    ]
    return vol, spacing, orig_indices, first_ipp

def run_segment_all(study, series_id, slice_idx, dicom_x, dicom_y, all_series_data):
    """Clinical Entry Point: Restored with Precision Axis Handshake."""
    _log(f"--- START SEGMENTATION (CLINICAL HANDSHAKE) ---")
    model, device = get_sam_model()
    
    if series_id not in all_series_data:
        _log(f"Error: Series {series_id} not found in all_series_data.")
        return {}
        
    target_series = all_series_data[series_id]
    folder_path = study.local_folder_path
    
    try:
        # 1. Coordinate Handshake (Front -> Clinical)
        seed_dicom_path = os.path.join(folder_path, target_series['files'][slice_idx])
        ds_seed = pydicom.dcmread(seed_dicom_path)
        point_patient = pixel_to_patient(dicom_y, dicom_x, ds_seed)
        _log(f"Seed Mapping: {point_patient}")

        # 2. Anatomical Sorting (Fixes Upside-Down)
        volume, spacing, orig_indices, first_ipp = _load_volume_sorted(folder_path, target_series['files'])
        
        # 3. Spatial Alignment (SURGICAL RAS HANDSHAKE)
        # Lock to standard RAS diagonal affine for ITK-Snap sanity
        # x-axis (dx), y-axis (dy), z-axis (dz)
        dx, dy, dz = spacing[1], spacing[2], spacing[0]
        affine = np.diag([dx, dy, dz, 1.0])
        affine[:3, 3] = first_ipp # Anchor to physical world
        
        nifti_img = nib.Nifti1Image(volume.transpose(2, 1, 0), affine)
        
        # DEBUG SAVE
        nifti_dir = r'c:\Users\MSI\Desktop\cerebro\media\volumes'
        os.makedirs(nifti_dir, exist_ok=True)
        nib.save(nifti_img, os.path.join(nifti_dir, f"debug_image_{study.id}.nii.gz"))
        
        # Map Physical mm to Voxel Space directly via array indices!
        # This prevents out-of-bounds ValueErrors caused by faulty affine matrices (where negative cosines inverted the bounding boxes).
        z_idx = orig_indices.index(int(slice_idx))
        v_vox = np.array([float(dicom_x), float(dicom_y), float(z_idx)])
        _log(f"Voxel Click EXACT: {v_vox} (Direct Array Index mapped from Frontend)")

        # 4. Core Stable Inference (WINNER: ZYX PERMUTATION)
        mask_3d, max_prob, iou_val = _infer_sam3d_stable(model, device, nifti_img, v_vox)
        
        # 5. Pack results into Compressed 3D Volumetric format for High-Performance React Engine
        import zlib
        import base64
        
        # Build FULL frontend volume representation
        D_total = len(target_series['files'])
        H_total = nifti_img.shape[1] # rows (Y)
        W_total = nifti_img.shape[0] # cols (X)
        
        # Allocate flat 3D volume (D, H, W) filled with 0s
        full_vol = np.zeros((D_total, H_total, W_total), dtype=np.uint8)
        
        # mask_3d shape is (Z, Y, X) from AI corresponding to the UNFLIPPED image block
        # Map each computed Z slice directly back to the frontend's true slice index
        for z in range(mask_3d.shape[0]):
            clinical_idx = orig_indices[z]
            # Copy (Y, X) into corresponding (H, W)
            full_vol[clinical_idx] = mask_3d[z]
            
        # Compress and Encode 
        compressed_bytes = zlib.compress(full_vol.tobytes(), level=1) # Fast compression
        b64_string = base64.b64encode(compressed_bytes).decode('utf-8')
        
        # Calculate real anatomical volume
        voxel_volume_cm3 = np.sum(full_vol) * float(spacing[0] * spacing[1] * spacing[2]) / 1000.0
        
        results = {
            str(series_id): {
                "mask": b64_string,
                "shape": [D_total, H_total, W_total],
                "confidence": float(max_prob) * 100.0, # Convert max_prob (e.g. 1.0) to percentage (100.0)
                "volume_cm3": float(voxel_volume_cm3)
            }
        }
        
        # DEBUG MASK SAVE (For ITK-Snap Audit)
        # mask_3d is (Z, Y, X) -> transpose to (X, Y, Z) to match image
        mask_save_path = os.path.join(nifti_dir, f"debug_mask_{study.id}.nii.gz")
        nib.save(nib.Nifti1Image(mask_3d.transpose(2, 1, 0), affine), mask_save_path)
        
        _log(f"Success: Volumetric Mask packed into Base64 (Size: {len(b64_string)} bytes)")
        return results, float(max_prob), float(iou_val)

    except Exception as e:
        import traceback
        _log(f"CRITICAL ERROR: {e}\n{traceback.format_exc()}")
        return {}, 0.0, 0.0

def _infer_sam3d_stable(model, device, nifti_img, v_vox, target_spacing=1.5):
    """Scientific Core: Hand-tuned for SAM-Med3D-Turbo Parity."""
    vol_data = nifti_img.get_fdata()
    orig_shape = vol_data.shape
    zooms = nifti_img.header.get_zooms()
    
    # Extract ROI from 128-cube (mm-locked)
    w_px = 128 * (target_spacing / zooms[0])
    h_px = 128 * (target_spacing / zooms[1])
    d_px = 128 * (target_spacing / zooms[2])
    
    cx, cy, cz = int(v_vox[0]), int(v_vox[1]), int(v_vox[2])
    x1, x2 = cx - int(w_px//2), cx + int(w_px//2)
    y1, y2 = cy - int(h_px//2), cy + int(h_px//2)
    z1, z2 = cz - int(d_px//2), cz + int(d_px//2)
    
    roi = np.full((int(w_px), int(h_px), int(d_px)), -1000.0)
    src_x1, src_x2 = max(0, x1), min(orig_shape[0], x2)
    src_y1, src_y2 = max(0, y1), min(orig_shape[1], y2)
    src_z1, src_z2 = max(0, z1), min(orig_shape[2], z2)
    
    dst_x1, dst_y1, dst_z1 = max(0, -x1), max(0, -y1), max(0, -z1)
    
    slice_data = vol_data[src_x1:src_x2, src_y1:src_y2, src_z1:src_z2]
    roi[dst_x1:dst_x1+slice_data.shape[0], 
        dst_y1:dst_y1+slice_data.shape[1], 
        dst_z1:dst_z1+slice_data.shape[2]] = slice_data

    # SCIENTIFIC HANDSHAKE: Permute (X, Y, Z) -> (Z, Y, X) for Turbo DNA
    roi_t = torch.from_numpy(roi).unsqueeze(0).unsqueeze(0).float()
    roi_t = torch.clamp(roi_t, -1000, 1000)

    # RE-INTRODUCE SAM PRIORS LOCALLY: Flip Y (axis 3) and Z (axis 4) 
    # This feeds the model the proper topological orientation without corrupting the global array mappings.
    roi_t = torch.flip(roi_t, dims=[3, 4])
    
    input_t = roi_t.permute(0, 1, 4, 3, 2).to(device)
    
    # Resample to exactly 128x128x128 
    input_t = F.interpolate(input_t, size=(128, 128, 128), mode='trilinear', align_corners=False)
    
    # Norm
    fg = input_t > 0
    if fg.any():
        input_t = (input_t - input_t[fg].mean()) / (input_t[fg].std() + 1e-8)
    else:
        input_t = (input_t - input_t.mean()) / (input_t.std() + 1e-8)
        
    with torch.no_grad():
        emb = model.image_encoder(input_t)
        # Click is at physical center of ROI (64,64,64 in 128-cube space)
        coords = torch.tensor([[[64.0, 64.0, 64.0]]], device=device, dtype=torch.float32)
        labels = torch.tensor([[1]], device=device, dtype=torch.int64)
        sparse, dense = model.prompt_encoder(points=(coords, labels), boxes=None, masks=torch.zeros(1,1,32,32,32, device=device))
        low_res, iou_predictions = model.mask_decoder(image_embeddings=emb, image_pe=model.prompt_encoder.get_dense_pe(), sparse_prompt_embeddings=sparse, dense_prompt_embeddings=dense, multimask_output=False)
        m128 = F.interpolate(low_res, size=(128, 128, 128), mode='trilinear', align_corners=False)
        probs = torch.sigmoid(m128).squeeze().cpu().numpy()
        
        # Reverse the local topological flips (Y and Z axes)
        probs = np.flip(probs, axis=(0, 1))

        iou_val = iou_predictions[0, 0].item() if iou_predictions is not None else 0.0

    # Reverse Permute (Z, Y, X) -> (X, Y, Z)
    probs_xyz = probs.transpose(2, 1, 0)
    mask_roi = (probs_xyz > 0.45).astype(np.uint8)
    
    # Upsample to ROI voxel grid
    mask_high = F.interpolate(torch.from_numpy(mask_roi).unsqueeze(0).unsqueeze(0).float(), 
                              size=(int(w_px), int(h_px), int(d_px)), 
                              mode='nearest').squeeze().numpy().astype(np.uint8)
    
    final_pred_xyz = np.zeros(orig_shape, dtype=np.uint8)
    final_pred_xyz[src_x1:src_x2, src_y1:src_y2, src_z1:src_z2] = mask_high[dst_x1:dst_x1+slice_data.shape[0], 
                                                                           dst_y1:dst_y1+slice_data.shape[1], 
                                                                           dst_z1:dst_z1+slice_data.shape[2]]
    
    # Convert NIfTI (X,Y,Z) to Clinical (Z,Y,X)
    return final_pred_xyz.transpose(2, 1, 0), np.max(probs), float(iou_val)
