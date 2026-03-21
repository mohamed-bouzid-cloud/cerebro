import os
import django
import pydicom

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cerebro.settings')
django.setup()

from accounts.models import DICOMStudy

study = DICOMStudy.objects.get(id=1)
folder = study.local_folder_path
print(f"Auditing Study {study.id}: {study.patient}")
print(f"Folder: {folder}")

series_info = {}
for root, dirs, files in os.walk(folder):
    for f in files:
        if f.lower().endswith(('.ima', '.dcm')):
            try:
                ds = pydicom.dcmread(os.path.join(root, f), stop_before_pixels=True)
                suid = ds.SeriesInstanceUID
                snum = getattr(ds, 'SeriesNumber', 0)
                if suid not in series_info:
                    series_info[suid] = {'number': snum, 'count': 0}
                series_info[suid]['count'] += 1
            except:
                pass

for suid, info in series_info.items():
    print(f"Series Number {info['number']} | SUID: {suid} | Count: {info['count']}")
