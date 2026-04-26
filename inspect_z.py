import os
import sys
import numpy as np
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
sys.path.append(r"c:\Users\MSI\Desktop\cerebro")
import django
django.setup()

from dicom_viewer.models import Study

studies = Study.objects.all()
if not studies.exists():
    print("No studies")
    sys.exit(0)

study = studies.first()
print(f"Study path: {study.local_folder_path}")

import pydicom
from collections import defaultdict
import glob

files = glob.glob(os.path.join(study.local_folder_path, "**", "*.dcm"), recursive=True)
print(f"Found {len(files)} DCM files")

series_dict = defaultdict(list)
for f in files:
    try:
        ds = pydicom.dcmread(f, stop_before_pixels=True)
        series_id = ds.SeriesInstanceUID
        series_dict[series_id].append(f)
    except:
        pass

# Pick the largest series
target_series = max(series_dict.keys(), key=lambda k: len(series_dict[k]))
dcm_files = series_dict[target_series]
print(f"Target Series {target_series} has {len(dcm_files)} slices.")

meta = []
for f in dcm_files:
    try:
        ds = pydicom.dcmread(f, stop_before_pixels=True)
        inst = int(getattr(ds, 'InstanceNumber', 0))
        z_pos = float(ds.ImagePositionPatient[2])
        meta.append({'inst': inst, 'z': z_pos, 'name': f, 'thickness': float(getattr(ds, 'SliceThickness', -1))})
    except Exception as e:
        pass

meta.sort(key=lambda x: x['inst'])

if len(meta) > 2:
    dz1 = abs(meta[1]['z'] - meta[0]['z'])
    dz2 = abs(meta[2]['z'] - meta[1]['z'])
    z_diffs = np.diff([m['z'] for m in meta])
    import numpy as np
    
    nonzero_diffs = np.abs(z_diffs[z_diffs != 0])
    actual_dz = np.median(nonzero_diffs) if len(nonzero_diffs) > 0 else 0
    
    thick_valid = [m['thickness'] for m in meta if m['thickness'] > 0]
    avg_thick = np.mean(thick_valid) if thick_valid else 0
    
    print(f"Z span (max - min): {abs(meta[-1]['z'] - meta[0]['z'])} mm")
    print(f"dz(0->1): {dz1}")
    print(f"dz(1->2): {dz2}")
    print(f"Median Z-diff: {actual_dz}")
    print(f"Mean SliceThickness: {avg_thick}")
    
    # Simulate a click in the middle
    mid_idx = len(meta) // 2
    dz = actual_dz if actual_dz > 0 else avg_thick
    
    c_z = float(mid_idx)
    half_window_mm = 192.0 / 2.0
    s_mm = dz
    dim_px = len(meta)
    
    c_mm = c_z * s_mm
    st_mm = max(0, min(c_mm - half_window_mm, dim_px * s_mm - 192.0))
    en_mm = st_mm + 192.0
    print(f"\nSimulated Crop for click at middle slice {mid_idx}:")
    print(f"Crop Z bounds (slices): [{int(round(st_mm/s_mm))}, {int(round(en_mm/s_mm))}]")
    print(f"Total window length in slices: {int(round(en_mm/s_mm)) - int(round(st_mm/s_mm))}")
