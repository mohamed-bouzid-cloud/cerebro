import pydicom
import os
path = r'C:\Users\MSI\Desktop\cerebro\brain_tumor_dicoms\ST000001\SE000001\IM000001.dcm'
ds = pydicom.dcmread(path, stop_before_pixels=True)
print(f"UID: {ds.SeriesInstanceUID}")
print(f"SN: {getattr(ds, 'SeriesNumber', 'UNK')}")
