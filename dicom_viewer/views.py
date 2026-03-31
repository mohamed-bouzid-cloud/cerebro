import os
import base64
import io
import numpy as np
import pydicom
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from accounts.models import DICOMStudy
from PIL import Image

def _log(msg):
    with open(r'c:\Users\MSI\Desktop\cerebro\ai_debug.log', 'a') as f:
        f.write(str(msg) + '\n')

def _get_dicom_series(folder_path):
    """Return a dictionary of series metadata and file lists."""
    if not os.path.exists(folder_path):
        return {}
        
    series_map = {}
    for root, dirs, files in os.walk(folder_path):
        for f in files:
            if f.lower().endswith(('.ima', '.dcm')):
                full_path = os.path.join(root, f)
                try:
                    ds = pydicom.dcmread(full_path, stop_before_pixels=True)
                    suid = str(getattr(ds, 'SeriesInstanceUID', 'none')).strip().strip('\0').rstrip('.')
                    snum_raw = getattr(ds, 'SeriesNumber', 0)
                    snum = int(snum_raw) if snum_raw not in (None, '') else 0
                    
                    desc = str(getattr(ds, 'SeriesDescription', 'No Description'))
                    
                    inst_raw = getattr(ds, 'InstanceNumber', 0)
                    inst = int(inst_raw) if inst_raw not in (None, '') else 0
                    
                    # Determine Plane
                    iop = getattr(ds, 'ImageOrientationPatient', None)
                    plane = 'Unknown'
                    if iop and len(iop) == 6:
                        abs_iop = [abs(x) for x in iop]
                        if abs_iop[0] > 0.5 and abs_iop[4] > 0.5: plane = 'Axial'
                        elif abs_iop[0] > 0.5 and abs_iop[5] > 0.5: plane = 'Coronal'
                        elif abs_iop[1] > 0.5 and abs_iop[5] > 0.5: plane = 'Sagittal'

                    # Determine Technique and Modality
                    modality = str(getattr(ds, 'Modality', 'Unknown'))
                    technique = ''
                    desc_lower = desc.lower()
                    seq_name = str(getattr(ds, 'SequenceName', '')).lower()
                    
                    if modality == 'MR':
                        if 't1' in desc_lower or 't1' in seq_name: technique = 'T1'
                        elif 't2' in desc_lower or 't2' in seq_name:
                            technique = 'FLAIR' if 'flair' in desc_lower or 'flair' in seq_name else 'T2'
                        elif 'flair' in desc_lower or 'flair' in seq_name: technique = 'FLAIR'
                        elif 'dwi' in desc_lower or 'dwi' in seq_name: technique = 'DWI'
                        elif 'adc' in desc_lower or 'adc' in seq_name: technique = 'ADC'
                        elif 'mprage' in desc_lower or 'mpr' in desc_lower: technique = 'MPRAGE'
                        elif 'tof' in desc_lower or 'angio' in desc_lower: technique = 'MRA'
                    elif modality == 'CT':
                        if 'bone' in desc_lower: technique = 'Bone'
                        elif 'lung' in desc_lower: technique = 'Lung'
                        elif 'angio' in desc_lower: technique = 'Angio'
                        elif 'cn' in desc_lower or 'contrast' in desc_lower: technique = 'Post-Contrast'
                        elif 'non' in desc_lower or 'wo' in desc_lower: technique = 'Non-Contrast'

                    if suid not in series_map:
                        series_map[suid] = {
                            'id': suid,
                            'number': snum,
                            'description': desc,
                            'plane': plane,
                            'modality': modality,
                            'technique': technique,
                            'files': [],
                            'folder': os.path.basename(root)
                        }
                    
                    rel_path = os.path.relpath(full_path, folder_path)
                    series_map[suid]['files'].append((rel_path, inst))
                except Exception:
                    continue
                    
    # Sort files within each series
    for suid in series_map:
        series_map[suid]['files'].sort(key=lambda x: x[1])
        series_map[suid]['files'] = [x[0] for x in series_map[suid]['files']]
    
    _log(f"DEBUG: All series found: {list(series_map.keys())}")
    return series_map


def _array_to_base64_png(arr):
    """Convert a 2-D numpy uint8 array to a base64-encoded PNG string."""
    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return base64.b64encode(buf.getvalue()).decode('utf-8')


from rest_framework.permissions import IsAuthenticated, AllowAny
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def serve_slice(request):
    """Serve a single DICOM slice as a base64 PNG image or return a list of series."""
    idx_str = request.GET.get('idx')
    study_id = request.GET.get('study_id')
    series_id = request.GET.get('series_id') # Can be SUID or SeriesNumber (as string)

    if not study_id:
        return JsonResponse({"error": "study_id is required"}, status=400)

    try:
        study = DICOMStudy.objects.get(id=study_id)
    except DICOMStudy.DoesNotExist:
        return JsonResponse({"error": "Study not found"}, status=404)

    folder_path = study.local_folder_path
    if not folder_path or not os.path.isdir(folder_path):
        return JsonResponse({"error": "Invalid folder path"}, status=404)

    all_series = _get_dicom_series(folder_path)
    if not all_series:
        return JsonResponse({"error": "No DICOM series found"}, status=404)

    # 1. DISCOVERY MODE (If no index, return list of available series)
    if idx_str is None:
        series_list = []
        for suid, data in all_series.items():
            series_list.append({
                'id': suid,
                'number': data['number'],
                'description': data['description'],
                'plane': data['plane'],
                'modality': data.get('modality', 'Unknown'),
                'technique': data.get('technique', ''),
                'count': len(data['files'])
            })
        # Sort by SeriesNumber
        series_list.sort(key=lambda x: x['number'])
        
        # Safe patient info extraction
        dicom_info = {
            'PatientID': study.study_id,
            'PatientName': study.patient.get_full_name(),
            'StudyDate': str(study.study_date),
            'StudyTime': str(study.study_time or ""),
            'Modality': study.modality
        }

        return JsonResponse({
            'series': series_list,
            'dicom_info': dicom_info
        })

    # 2. FETCH MODE (Return specific slice)
    idx = int(idx_str)
    
    # Pick a series
    target_series = None
    if series_id:
        # Match by SUID or Number
        if series_id in all_series:
            target_series = all_series[series_id]
        else:
            for s in all_series.values():
                if str(s['number']) == series_id:
                    target_series = s
                    break
    
    if not target_series:
        # Default to the first series with most slices if not specified
        sorted_series = sorted(all_series.values(), key=lambda x: len(x['files']), reverse=True)
        target_series = sorted_series[0]

    files = target_series['files']
    if idx < 0 or idx >= len(files):
        return JsonResponse({"error": "Index out of range"}, status=400)

    file_path = os.path.join(folder_path, files[idx])
    
    try:
        ds = pydicom.dcmread(file_path)
        pixel_array = ds.pixel_array
        
        # Normalize to 0-255 uint8 for PNG
        pixel_array = pixel_array.astype(float)
        p_min = np.min(pixel_array)
        p_max = np.max(pixel_array)
        
        if p_max > p_min:
            pixel_array = ((pixel_array - p_min) / (p_max - p_min)) * 255.0
        else:
            pixel_array = np.zeros_like(pixel_array)
            
        pixel_array = pixel_array.astype(np.uint8)
        image_b64 = _array_to_base64_png(pixel_array)
        
        h, w = pixel_array.shape[:2]
        
        return JsonResponse({
            'image': image_b64,
            'total': len(files),
            'current': idx,
            'series_id': target_series['id'],
            'width': w,
            'height': h
        })
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
@api_view(['POST'])
@permission_classes([AllowAny])
def segment_volume(request):
    """Trigger cross-series AI segmentation based on a single point."""
    data = request.data
    study_id = data.get('study_id')
    series_id = str(data.get('series_id', '')).strip().strip('\0').rstrip('.')
    slice_idx = data.get('slice_idx')
    dicom_x = data.get('dicom_x')
    dicom_y = data.get('dicom_y')
    _log(f"DEBUG: segment_volume dicom_click at ({dicom_x}, {dicom_y}) on slice {slice_idx}")

    if not all([study_id, series_id, slice_idx is not None, dicom_x is not None, dicom_y is not None]):
        return JsonResponse({"error": "Missing parameters"}, status=400)

    try:
        study = DICOMStudy.objects.get(id=study_id)
        folder_path = study.local_folder_path
        all_series_data = _get_dicom_series(folder_path)
        _log(f"DEBUG: Received series_id: '{series_id}' (len={len(series_id)})")
        for k in all_series_data:
            if k == series_id:
                _log(f"DEBUG: MATCH FOUND for {k}")
            else:
                _log(f"DEBUG: NO MATCH for {k} (len={len(k)})")
                # Check for shared prefix
                if k.startswith(series_id[:10]):
                    _log(f"DEBUG:   Shared prefix found. Hex diff: k={k.encode().hex()}, sid={series_id.encode().hex()}")

        from .segment_all import run_segment_all
        
        masks, confidence, accuracy = run_segment_all(study, series_id, slice_idx, dicom_x, dicom_y, all_series_data)
        
        return JsonResponse({"masks": masks, "confidence": confidence, "accuracy": accuracy})
    except Exception as e:
        import traceback
        err_str = traceback.format_exc()
        _log(f"\nCRITICAL ERROR in segment_volume:\n{err_str}")
        print(err_str)
        return JsonResponse({"error": str(e), "traceback": err_str}, status=500)
