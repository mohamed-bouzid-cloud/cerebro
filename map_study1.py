import pydicom
import os
base = r'C:\Users\MSI\Desktop\cerebro\brain_tumor_dicoms\ST000001'
for folder in sorted(os.listdir(base)):
    fpath = os.path.join(base, folder)
    if os.path.isdir(fpath):
        files = [f for f in os.listdir(fpath) if f.lower().endswith('.dcm')]
        if files:
            ds = pydicom.dcmread(os.path.join(fpath, files[0]), stop_before_pixels=True)
            suid = str(ds.SeriesInstanceUID).strip().rstrip('.')
            snum = getattr(ds, 'SeriesNumber', 'UNK')
            print(f"Folder: {folder} | SN: {snum} | SUID: {suid}")
