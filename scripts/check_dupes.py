import os
import glob
import pydicom
from collections import Counter

study_path = r"c:\Users\MSI\Desktop\cerebro\studies\ST000002"
files = glob.glob(os.path.join(study_path, "**", "*.dcm"), recursive=True)

zs = []
errors = []
for f in files:
    try:
        ds = pydicom.dcmread(f, stop_before_pixels=True)
        z = float(ds.ImagePositionPatient[2])
        zs.append(z)
    except Exception as e:
        errors.append((f, str(e)))

print(f"Total files found: {len(files)}")
print(f"Read errors: {len(errors)}")
if errors:
    print(f"First error: {errors[0]}")

if zs:
    counts = Counter(zs)
    dupes = {z: count for z, count in counts.items() if count > 1}
    print(f"Unique Z positions: {len(counts)}")
    print(f"Duplicate Z positions found: {len(dupes)}")
    
    if dupes:
        print("This series has DUPLICATES. Each slice is present multiple times.")
        print(f"Example duplication factor: {list(dupes.values())[0]}")
    else:
        print("This series is CLEAN. No duplicate Z positions.")
        if len(zs) == 370:
            print("It's a high-resolution scan with 370 unique slices.")
