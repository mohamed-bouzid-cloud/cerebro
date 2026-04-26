import os
import sys
import torch
import numpy as np
import pydicom
import nibabel as nib
import torch.nn.functional as F
import zlib
import base64
from scipy.ndimage import zoom as nd_zoom
from scipy.ndimage import label, binary_fill_holes, binary_closing, binary_erosion, binary_opening, generate_binary_structure, gaussian_filter

# ── SAM-Med3D path ─────────────────────────────────────────────────────────────
SAM_PATH = r'c:\Users\MSI\SAM-Med3D'
if SAM_PATH not in sys.path:
    sys.path.append(SAM_PATH)

from segment_anything.build_sam3D import sam_model_registry3D

# ── CLINICAL ZENITH (V13) ───────────────────────────────────────────────────────
CROP_SIZE = 128
FINAL_THRESHOLD = 0.55 # V15 tuned: Stricter probability boundary to prevent leakage
NUM_REFINE_ROUNDS = 3

def _log(msg):
    with open(r'c:\Users\MSI\Desktop\cerebro\ai_debug.log', 'a') as f:
        f.write(f"[ZENITH-V13] {msg}\n")

_MODEL_CACHE = {}

def get_sam_model():
    if 'model' not in _MODEL_CACHE:
        ckpt = os.path.join(SAM_PATH, 'ckpt', 'sam_med3d_turbo.pth')
        model = sam_model_registry3D['vit_b'](checkpoint=None, prompt_embed_dim=384)
        sd = torch.load(ckpt, map_location='cpu')
        if 'model_state_dict' in sd: sd = sd['model_state_dict']
        model.load_state_dict(sd, strict=False)
        _MODEL_CACHE['model'] = model.to('cpu').eval()
        _MODEL_CACHE['device'] = 'cpu'
        if torch.cuda.is_available():
            _MODEL_CACHE['model'].to('cuda')
            _MODEL_CACHE['device'] = 'cuda'
    return _MODEL_CACHE['model'], _MODEL_CACHE['device']

def _load_volume_synced(folder_path, dcm_files):
    meta = []
    for f in dcm_files:
        try:
            ds = pydicom.dcmread(os.path.join(folder_path, f))
            inst = int(getattr(ds, 'InstanceNumber', 0))
            z_pos = float(ds.ImagePositionPatient[2])
            meta.append({'inst': inst, 'z': z_pos, 'ds': ds})
        except: continue
    
    meta.sort(key=lambda x: x['inst'])
    
    slices = []
    for m in meta:
        ds = m['ds']
        hu = ds.pixel_array.astype(np.float32) * float(getattr(ds, 'RescaleSlope', 1.0)) + float(getattr(ds, 'RescaleIntercept', 0.0))
        slices.append(hu.T)
        
    vol = np.stack(slices, axis=-1)
    ds0 = meta[0]['ds']
    
    # Safe DZ
    z_diffs = np.diff([m['z'] for m in meta])
    non_zero = np.abs(z_diffs[z_diffs != 0])
    if len(non_zero) > 0:
        dz = float(np.median(non_zero))
    else:
        dz = float(getattr(ds0, 'SliceThickness', 1.0))
    if dz == 0.0: dz = 1.0
        
    spacing = (float(ds0.PixelSpacing[1]), float(ds0.PixelSpacing[0]), dz)
    return vol, spacing

def run_segment_all(study, series_id, slice_idx, dx, dy, all_series):
    try:
        _log(f"--- START V13 CLINICAL ZENITH ---")
        model, device = get_sam_model()
        vol, spacing = _load_volume_synced(study.local_folder_path, all_series[series_id]['files'])
        Xn, Yn, Zn = vol.shape
        
        WINDOW_MM = 192.0
        
        def get_padded_crop(c_px, s_mm, dim_px, win_mm):
            c_mm = float(c_px) * float(s_mm)
            st_mm = c_mm - (win_mm / 2.0)
            target_px_length = int(round(win_mm / s_mm))
            
            p_start = int(round(st_mm / s_mm))
            p_end = p_start + target_px_length
            
            v_start = max(0, p_start)
            v_end = min(dim_px, p_end)
            
            pad_start = max(0, -p_start)
            pad_end = max(0, p_end - dim_px)
            
            return v_start, v_end, pad_start, pad_end, target_px_length
        
        WINDOW_MM_XY = 240.0
        WINDOW_MM_Z  = 240.0 # REVERTED to original locked production state
        
        v_x0, v_x1, pad_x_before, pad_x_after, targ_x = get_padded_crop(dx, spacing[0], Xn, WINDOW_MM_XY)
        v_y0, v_y1, pad_y_before, pad_y_after, targ_y = get_padded_crop(dy, spacing[1], Yn, WINDOW_MM_XY)
        v_z0, v_z1, pad_z_before, pad_z_after, targ_z = get_padded_crop(slice_idx, spacing[2], Zn, WINDOW_MM_Z)
        
        # Protect against 0 sizing
        if v_x1 <= v_x0 or v_y1 <= v_y0 or v_z1 <= v_z0:
            raise ValueError(f"Crop out of bounds: slice_idx {slice_idx} with Zn {Zn}")
            
        crop_vol = vol[v_x0:v_x1, v_y0:v_y1, v_z0:v_z1]
        
        # AIR PADDING (-1000 HU) ensures mathematical isotropic purity
        crop_native = np.pad(crop_vol, 
                             ((pad_x_before, pad_x_after),
                              (pad_y_before, pad_y_after),
                              (pad_z_before, pad_z_after)),
                             mode='constant', constant_values=-1000)
        
        z_to_128 = (128.0/crop_native.shape[0], 128.0/crop_native.shape[1], 128.0/crop_native.shape[2])
        crop_iso = nd_zoom(crop_native, z_to_128, order=3, prefilter=True).astype(np.float32) # High-fidelity Cubic zoom
        
        lx = (float(dx)- (v_x0 - pad_x_before))*z_to_128[0]
        ly = (float(dy)- (v_y0 - pad_y_before))*z_to_128[1]
        lz = (float(slice_idx)- (v_z0 - pad_z_before))*z_to_128[2]
        
        crop_norm = (np.clip(crop_iso, -125, 225) - 50) / 100.0
        t = torch.from_numpy(np.transpose(crop_norm, (2, 1, 0))).unsqueeze(0).unsqueeze(0).float().to(device)
        
        with torch.no_grad():
            emb = model.image_encoder(t)
            
            # --- PASS 1: EXPLORATION ---
            prev = torch.zeros(1, 1, 32, 32, 32, device=device)
            pc = torch.tensor([[[lz, ly, lx]]], dtype=torch.float32).to(device)
            pl = torch.tensor([[1]], dtype=torch.long).to(device)
            
            for _ in range(2):
                sp, de = model.prompt_encoder(points=(pc, pl), boxes=None, masks=prev)
                low, iou = model.mask_decoder(image_embeddings=emb, image_pe=model.prompt_encoder.get_dense_pe(), sparse_prompt_embeddings=sp, dense_prompt_embeddings=de, multimask_output=False)
                prev = F.interpolate(low, size=(32,32,32), mode='trilinear', align_corners=False)
            
            m1_explore = torch.sigmoid(F.interpolate(low, size=(128,128,128), mode='trilinear')).cpu().numpy().squeeze()
            m1_bin = m1_explore > 0.30
            z_indices = np.where(np.any(m1_bin, axis=(1,2)))[0]
            
            pts = [[lz, ly, lx]]
            lbls = [1]
            
            if len(z_indices) > 5:
                # Add Top Pole anchor - drive SAM attention to the very tip
                for z_val in z_indices:
                    y_t, x_t = np.where(m1_bin[z_val])
                    if len(y_t) > 1:
                        my, mx = float(np.mean(y_t)), float(np.mean(x_t))
                        dists = (y_t - my)**2 + (x_t - mx)**2
                        pts.append([float(z_val), float(y_t[np.argmin(dists)]), float(x_t[np.argmin(dists)])])
                        lbls.append(1)
                        break
                
                # Add Bottom Pole anchor
                for z_val in reversed(z_indices):
                    y_b, x_b = np.where(m1_bin[z_val])
                    if len(y_b) > 1:
                        my, mx = float(np.mean(y_b)), float(np.mean(x_b))
                        dists = (y_b - my)**2 + (x_b - mx)**2
                        pts.append([float(z_val), float(y_b[np.argmin(dists)]), float(x_b[np.argmin(dists)])])
                        lbls.append(1)
                        break
                    
            _log(f"Phase 2 multi-point anchor count: {len(pts)}")
            
            # --- PASS 2: FULL ATTENTION FORCING ---
            pc = torch.tensor([pts], dtype=torch.float32).to(device)
            pl = torch.tensor([lbls], dtype=torch.long).to(device)
            prev = torch.zeros(1, 1, 32, 32, 32, device=device) # Reset to ensure full compliance with the new poles
            
            for _ in range(NUM_REFINE_ROUNDS):
                sp, de = model.prompt_encoder(points=(pc, pl), boxes=None, masks=prev)
                low, iou = model.mask_decoder(image_embeddings=emb, image_pe=model.prompt_encoder.get_dense_pe(), sparse_prompt_embeddings=sp, dense_prompt_embeddings=de, multimask_output=False)
                prev = F.interpolate(low, size=(32,32,32), mode='trilinear', align_corners=False)
                
            probs = np.transpose(torch.sigmoid(F.interpolate(low, size=(128,128,128), mode='trilinear')).cpu().numpy().squeeze(), (2,1,0))

        # --- SMOOTH RECONSTRUCTION AND UN-PADDING ---
        probs_native = nd_zoom(probs, (1.0/z_to_128[0], 1.0/z_to_128[1], 1.0/z_to_128[2]), order=1) # Trilinear smoothing for organic edges
        probs_native = gaussian_filter(probs_native, sigma=0.75) # Deep anti-staircase diffusion
        mask_native_full = probs_native > FINAL_THRESHOLD
        
        # V14 ANATOMICAL GUARD: Prevent leakage into perirenal fat (< 5) or bone (> 350)
        # Using crop_native because it matches probs_native shape perfectly
        hu_guard = (crop_native >= 5) & (crop_native <= 350)
        mask_native_full = mask_native_full & hu_guard
        
        end_x = mask_native_full.shape[0] - pad_x_after
        end_y = mask_native_full.shape[1] - pad_y_after
        end_z = mask_native_full.shape[2] - pad_z_after
        
        # Valid physical bounds extracted back from padded logic
        unpadded_mask = mask_native_full[pad_x_before:end_x, pad_y_before:end_y, pad_z_before:end_z]
        
        mask_xyz = np.zeros(vol.shape, dtype=np.uint8)
        mask_xyz[v_x0:v_x1, v_y0:v_y1, v_z0:v_z1] = unpadded_mask
        
        # ANTI-OVERFLOW: Morphological Opening to remove raggedy leaked edges and break thin bridges
        struct = generate_binary_structure(3, 1) # 6-connectivity 
        mask_xyz = binary_opening(mask_xyz, structure=struct, iterations=2).astype(np.uint8)
        
        mask_xyz = binary_fill_holes(mask_xyz).astype(np.uint8)
        
        # ISOLATION LOCK 
        labs, n = label(mask_xyz)
        if n > 0:
            cx, cy, cz = int(round(float(dx))), int(round(float(dy))), int(round(float(slice_idx)))
            cx, cy, cz = max(0, min(Xn-1, cx)), max(0, min(Yn-1, cy)), max(0, min(Zn-1, cz))
            region = labs[max(0,cx-2):min(Xn,cx+3), max(0,cy-2):min(Yn,cy+3), max(0,cz-1):min(Zn,cz+2)]
            u, c = np.unique(region, return_counts=True)
            valid = u > 0
            if any(valid):
                target_label = u[valid][np.argmax(c[valid])]
                mask_xyz = (labs == target_label).astype(np.uint8)
            else:
                mask_xyz = (labs == np.argmax(np.bincount(labs.ravel())[1:]) + 1).astype(np.uint8)

        film = np.zeros((Zn, Yn, Xn), dtype=np.uint8)
        for pz in range(Zn): film[pz] = mask_xyz[:, :, pz].T
        
        v_v = float(mask_xyz.sum()) * spacing[0] * spacing[1] * spacing[2] / 1000.0
        conf_pct = round((1.0 / (1.0 + np.exp(-(float(iou[0,0]) + 0.5) * 4.0))) * 100, 1)
        
        payload = base64.b64encode(zlib.compress(film.tobytes(), level=1)).decode('utf-8')
        return {'masks': {series_id: {'mask': payload, 'shape': list(film.shape), 'confidence': conf_pct, 'volume_cm3': round(v_v, 1)}}}, conf_pct, round(v_v, 1)
    except Exception as e:
        import traceback
        _log(f"CRITICAL V13 ERROR: {str(e)}\n{traceback.format_exc()}")
        raise e
