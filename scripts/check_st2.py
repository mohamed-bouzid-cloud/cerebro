import os
import sys
import numpy as np
import pydicom
from collections import defaultdict
import glob

# Set settings to cerebro.settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cerebro.settings")
sys.path.append(r"c:\Users\MSI\Desktop\cerebro")
import django
django.setup()

from accounts.models import DICOMStudy

study_path = r"c:\Users\MSI\Desktop\cerebro\studies\ST000002"
print(f"Inspecting path: {study_path}")

files = glob.glob(os.path.join(study_path, "**", "*.dcm"), recursive=True)
print(f"Found {len(files)} DCM files")

series_dict = defaultdict(list)
for f in files:
    try:
        ds = pydicom.dcmread(f, stop_before_pixels=True)
        series_id = ds.SeriesInstanceUID
        series_num = getattr(ds, 'SeriesNumber', 'N/A')
        series_desc = getattr(ds, 'SeriesDescription', 'No Desc')
        key = (series_id, series_num, series_desc)
        series_dict[key].append(f)
    except Exception as e:
        print(f"Error reading {f}: {e}")

for (uid, num, desc), dcm_files in series_dict.items():
    print(f"\nSeries Number: {num}")
    print(f"Description: {desc}")
    print(f"UID: {uid}")
    print(f"Count: {len(dcm_files)} slices")
