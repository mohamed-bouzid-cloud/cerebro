import os
import sys
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cerebro.settings")
sys.path.append(r"c:\Users\MSI\Desktop\cerebro")
import django
django.setup()

from accounts.models import DICOMStudy
import dicom_viewer.segment_all as seg
import pydicom
from collections import defaultdict
import glob

study = DICOMStudy.objects.all().first()
files = glob.glob(os.path.join(study.local_folder_path, "**", "*.dcm"), recursive=True)

series_dict = defaultdict(list)
for f in files:
    try:
        ds = pydicom.dcmread(f, stop_before_pixels=True)
        series_id = ds.SeriesInstanceUID
        series_dict[series_id].append(f)
    except:
        pass

target_series = max(series_dict.keys(), key=lambda k: len(series_dict[k]))
all_series = {target_series: {'files': series_dict[target_series]}}

# The user's last click
slice_idx = 113
dx, dy = 352, 239

print("Starting manual V11 inference...")
try:
    res, conf, vol = seg.run_segment_all(study, target_series, slice_idx, dx, dy, all_series)
    print(f"Inference Complete. Vol: {vol} cm3")
    
    import base64, zlib, numpy as np
    payload = res['masks'][target_series]['mask']
    shape = res['masks'][target_series]['shape']
    
    decompressed = zlib.decompress(base64.b64decode(payload))
    film = np.frombuffer(decompressed, dtype=np.uint8).reshape(shape)
    
    # Analyze Z profile
    z_counts = []
    for z in range(shape[0]):
        z_counts.append(film[z].sum())
        
    z_non_zero = np.where(np.array(z_counts) > 0)[0]
    if len(z_non_zero) > 0:
        print(f"Mask is present from slice {z_non_zero[0]} to {z_non_zero[-1]} (Total {len(z_non_zero)} slices)")
        print(f"Last 10 slices counts (bottom pole): {z_counts[z_non_zero[-1]-9: z_non_zero[-1]+1]}")
    else:
        print("Mask is empty!")
except Exception as e:
    import traceback
    traceback.print_exc()
