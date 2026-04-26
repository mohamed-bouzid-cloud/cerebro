import os, sys, django, torch, numpy as np
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cerebro.settings")
sys.path.append(r"c:\Users\MSI\Desktop\cerebro")
django.setup()

from accounts.models import DICOMStudy
import dicom_viewer.segment_all as seg

study = DICOMStudy.objects.all().first()
import glob
files = glob.glob(os.path.join(study.local_folder_path, "**", "*.dcm"), recursive=True)
import pydicom
from collections import defaultdict
series_dict = defaultdict(list)
for f in files:
    try:
        ds = pydicom.dcmread(f, stop_before_pixels=True)
        series_dict[ds.SeriesInstanceUID].append(f)
    except: pass
target_series = max(series_dict.keys(), key=lambda k: len(series_dict[k])) if series_dict else None
all_series = {target_series: {'files': series_dict[target_series]}} if target_series else {}

# The user's exact click that failed to 20cm3!
slice_idx = 118
dx, dy = 369, 230

print("Testing V13 Fixed (Nearest Valid Pixel for multi-point)")
import copy
seg_backup = copy.deepcopy(seg.run_segment_all)

# We will monkeypatch run_segment_all directly to avoid file collision for now
def patched_run(*args, **kwargs):
    # We just run it directly. Let's write the code inside test_offline.
    pass

res, conf, vol = seg.run_segment_all(study, target_series, slice_idx, dx, dy, all_series)
print("Using current segment_all.py vol:", vol)
