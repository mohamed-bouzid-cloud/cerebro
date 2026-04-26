import os
import zlib
import base64
import numpy as np
import pydicom
from skimage.measure import marching_cubes
import trimesh
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import traceback
from scipy.ndimage import gaussian_filter
from scipy.stats import skew, kurtosis, entropy
from skimage.feature import graycomatrix, graycoprops

def _log(msg):
    log_path = r'c:\Users\MSI\Desktop\cerebro\media\lab_assets\lab_debug.log'
    with open(log_path, 'a') as f:
        f.write(f"{msg}\n")

def generate_lab_assets(study_folder, dicom_files, mask_base64, shape, out_dir):
    try:
        os.makedirs(out_dir, exist_ok=True)
        _log(f"--- Generate Lab Assets for {out_dir} ---")
        
        # 1. Decompress mask if provided
        mask_film = None
        if mask_base64 and shape:
            try:
                raw_bytes = base64.b64decode(mask_base64)
                decompressed = zlib.decompress(raw_bytes)
                mask_film = np.frombuffer(decompressed, dtype=np.uint8).reshape(shape)
                _log(f"Mask loaded. Shape: {mask_film.shape}")
            except Exception as e:
                _log(f"Mask decompression failed: {str(e)}")
        
        # 2. Extract DICOM data
        hu_vol = []
        z_positions = []
        ds_first = None
        for dcm_path in dicom_files:
            ds = pydicom.dcmread(os.path.join(study_folder, dcm_path), force=True)
            if ds_first is None: ds_first = ds
            
            try:
                z_pos = float(ds.ImagePositionPatient[2])
                z_positions.append(z_pos)
            except:
                pass
                
            slope = float(getattr(ds, 'RescaleSlope', 1.0))
            intercept = float(getattr(ds, 'RescaleIntercept', 0.0))
            hu = ds.pixel_array.astype(np.float32) * slope + intercept
            hu_vol.append(hu)
            
        hu_vol = np.stack(hu_vol, axis=0) # shape: (Z, Y, X)
        
        # Calculate robust DZ
        dz = 1.0
        if len(z_positions) > 1:
            z_diffs = np.diff(z_positions)
            non_zero = np.abs(z_diffs[z_diffs != 0])
            if len(non_zero) > 0:
                dz = float(np.median(non_zero))
        else:
            dz = float(getattr(ds_first, 'SliceThickness', 1.0))
            
        px = getattr(ds_first, 'PixelSpacing', [1.0, 1.0])
        spacing = (float(dz), float(px[0]), float(px[1]))
        _log(f"Volume loaded. Shape: {hu_vol.shape}")
        
        assets = {
            "kidney": None,
            "bone": None,
            "torso": None,
            "histogram": None,
            "stats": None
        }

        # 3. Radiomics & Kidney Mesh
        if mask_film is not None:
            if mask_film.shape != hu_vol.shape:
                _log(f"SHAPE MISMATCH: mask={mask_film.shape}, vol={hu_vol.shape}")
                # Try to fix by simple padding/cropping or logging
            
            roi_hu = hu_vol[mask_film > 0]
            if len(roi_hu) > 0:
                hist_vals, _ = np.histogram(roi_hu, bins=256)
                hist_norm = hist_vals / (hist_vals.sum() + 1e-9)
                ent = float(entropy(hist_norm))
                
                stats = {
                    "mean": float(np.mean(roi_hu)),
                    "median": float(np.median(roi_hu)),
                    "std": float(np.std(roi_hu)),
                    "var": float(np.var(roi_hu)),
                    "min": float(np.min(roi_hu)),
                    "max": float(np.max(roi_hu)),
                    "skewness": float(skew(roi_hu)),
                    "kurtosis": float(kurtosis(roi_hu)),
                    "entropy": ent,
                    "rms": float(np.sqrt(np.mean(roi_hu**2))),
                    "mad": float(np.mean(np.abs(roi_hu - np.mean(roi_hu)))),
                    "volume_voxels": int(np.sum(mask_film > 0))
                }

                # Texture (GLCM) from largest slice
                stats["glcm_contrast"] = 0.0
                stats["glcm_homogeneity"] = 0.0
                stats["glcm_energy"] = 0.0
                stats["glcm_correlation"] = 0.0
                stats["glcm_dissimilarity"] = 0.0
                stats["glcm_asm"] = 0.0
                
                z_counts = mask_film.sum(axis=(1, 2))
                best_z = np.argmax(z_counts)
                slice_hu = hu_vol[best_z]
                slice_mask = mask_film[best_z]
                
                if slice_mask.sum() > 0:
                    min_hu, max_hu = slice_hu.min(), slice_hu.max()
                    norm_hu = np.uint8(255 * (slice_hu - min_hu) / (max_hu - min_hu + 1e-5))
                    norm_hu[slice_mask == 0] = 0
                    try:
                        glcm = graycomatrix(norm_hu, distances=[1], angles=[0], levels=256, symmetric=True, normed=True)
                        stats["glcm_contrast"] = float(graycoprops(glcm, 'contrast')[0, 0])
                        stats["glcm_homogeneity"] = float(graycoprops(glcm, 'homogeneity')[0, 0])
                        stats["glcm_energy"] = float(graycoprops(glcm, 'energy')[0, 0])
                        stats["glcm_correlation"] = float(graycoprops(glcm, 'correlation')[0, 0])
                        stats["glcm_dissimilarity"] = float(graycoprops(glcm, 'dissimilarity')[0, 0])
                        stats["glcm_asm"] = float(graycoprops(glcm, 'ASM')[0, 0])
                    except Exception as e:
                        _log(f"GLCM failed: {e}")

                # Shape features from mesh
                stats["surface_area"] = 0.0
                stats["volume_mesh"] = 0.0
                stats["sphericity"] = 0.0
                stats["svr"] = 0.0

                try:
                    mask_soft = gaussian_filter(mask_film.astype(np.float32), sigma=0.8)
                    v, f, n, _ = marching_cubes(mask_soft, level=0.5, spacing=spacing)
                    if len(v) > 0:
                        mesh = trimesh.Trimesh(vertices=v, faces=f, vertex_normals=n)
                        trimesh.smoothing.filter_laplacian(mesh, iterations=5)
                        
                        # Compute Shape features
                        area = float(mesh.area)
                        # Trimesh volume can be negative depending on face winding, use abs()
                        vol = abs(float(mesh.volume))
                        
                        # Use voxel counting for ground truth volumetrics (robust against mesh errors)
                        voxel_vol_mm3 = int(np.sum(mask_film > 0)) * (spacing[0] * spacing[1] * spacing[2])
                        
                        stats["surface_area"] = area
                        # Always prefer true voxel integration for the medical volume to guarantee clinical accuracy
                        stats["volume_mesh"] = float(voxel_vol_mm3)
                        
                        if vol > 0 and area > 0:
                            stats["sphericity"] = float((np.pi ** (1/3) * (6 * vol) ** (2/3)) / area)
                            stats["svr"] = float(area / vol)
                        else:
                            stats["sphericity"] = 0.0
                            stats["svr"] = 0.0
                        
                        mesh.export(os.path.join(out_dir, 'kidney.glb'))
                        assets["kidney"] = "kidney.glb"
                        _log("Kidney mesh generated.")
                    else:
                        _log("Kidney mesh vertices empty.")
                except Exception as e:
                    _log(f"Kidney mesh failed: {traceback.format_exc()}")

                with open(os.path.join(out_dir, 'stats.json'), 'w') as fh:
                    json.dump(stats, fh)
                assets["stats"] = "stats.json"

                plt.figure(figsize=(6, 4), facecolor='#0a0a0c')
                ax = plt.axes()
                ax.set_facecolor('#0a0a0c')
                ax.hist(roi_hu, bins=64, color='#ec4899', alpha=0.7)
                ax.tick_params(colors='white')
                plt.tight_layout()
                plt.savefig(os.path.join(out_dir, 'histogram.png'), dpi=150)
                plt.close()
                assets["histogram"] = "histogram.png"

        # 4. Bone Mesh (HU > 200)
        try:
            bone_vol = hu_vol[::2, ::2, ::2]
            bone_mask = (bone_vol > 200).astype(np.float32)
            bone_mask = gaussian_filter(bone_mask, sigma=0.5)
            v_b, f_b, n_b, _ = marching_cubes(bone_mask, level=0.5)
            v_b *= 2 
            mesh_bone = trimesh.Trimesh(vertices=v_b, faces=f_b, vertex_normals=n_b)
            trimesh.smoothing.filter_laplacian(mesh_bone, iterations=3)
            mesh_bone.export(os.path.join(out_dir, 'bone.glb'))
            assets["bone"] = "bone.glb"
            _log("Bone mesh generated.")
        except Exception as e:
            _log(f"Bone mesh failed: {str(e)}")

        # 5. Torso Mesh (HU > -200)
        try:
            torso_vol = hu_vol[::2, ::2, ::2]
            torso_mask = (torso_vol > -200).astype(np.float32)
            torso_mask = gaussian_filter(torso_mask, sigma=1.0)
            v_t, f_t, n_t, _ = marching_cubes(torso_mask, level=0.5)
            v_t *= 2
            mesh_torso = trimesh.Trimesh(vertices=v_t, faces=f_t, vertex_normals=n_t)
            trimesh.smoothing.filter_laplacian(mesh_torso, iterations=5)
            mesh_torso.export(os.path.join(out_dir, 'torso.glb'))
            assets["torso"] = "torso.glb"
            _log("Torso mesh generated.")
        except Exception as e:
            _log(f"Torso mesh failed: {str(e)}")

        return {"success": True, "assets": assets}
    except Exception as e:
        _log(f"CRITICAL ERROR: {traceback.format_exc()}")
        return {"error": str(e)}
