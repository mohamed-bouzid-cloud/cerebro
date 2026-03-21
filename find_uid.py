import os
import django
import pydicom

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cerebro.settings')
django.setup()

from accounts.models import DICOMStudy

study = DICOMStudy.objects.get(id=1)
folder = study.local_folder_path

for root, dirs, files in os.walk(folder):
    for f in files:
        if f.lower().endswith(('.ima', '.dcm')):
            ds = pydicom.dcmread(os.path.join(root, f), stop_before_pixels=True)
            if getattr(ds, 'SeriesNumber', 0) == 1:
                print(ds.SeriesInstanceUID)
                sys.exit(0)
import sys
