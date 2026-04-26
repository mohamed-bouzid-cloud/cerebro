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

study_path = r"c:\Users\MSI\Desktop\cerebro\studies\ST000002"
files = glob.glob(os.path.join(study_path, "**", "*.dcm"), recursive=True)

meta = []
for f in files:
    try:
        ds = pydicom.dcmread(f, stop_before_pixels=True)
        meta.append({
            'inst': int(getattr(ds, 'InstanceNumber', 0)),
            'z': float(ds.ImagePositionPatient[2]),
            'thickness': float(getattr(ds, 'SliceThickness', 0))
        })
    except:
        pass

meta.sort(key=lambda x: x['inst'])

if len(meta) > 1:
    z_positions = [m['z'] for m in meta]
    unique_z = len(set(z_positions))
    print(f"Total slices: {len(meta)}")
    print(f"Unique Z positions: {unique_z}")
    print(f"Slice Thickness: {meta[0]['thickness']}")
    
    if unique_z < len(meta):
        print("WARNING: Duplicate Z positions found!")
        # Count how many of each
        counts = defaultdict(int)
        for z in z_positions:
            counts[z] += 1
        print(f"Example duplicates: {list(counts.items())[:5]}")
    else:
        print("No duplicate Z positions. This is a clean series of 370 slices.")

    # Calculate median spacing
    if len(meta) > 2:
        z_diffs = np.diff(sorted(list(set(z_positions))))
        print(f"Median Z-spacing: {np.median(abs(z_diffs))}")
