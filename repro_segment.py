import os
import sys
import django
import json

# Setup Django
sys.path.append('c:/Users/MSI/Desktop/cerebro')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cerebro.settings')
try:
    django.setup()
except:
    pass

from dicom_viewer.views import segment_volume
from django.test import RequestFactory
from accounts.models import DICOMStudy

factory = RequestFactory()
study = DICOMStudy.objects.first() # Let's assume the first study
if not study:
    print("No study found")
    sys.exit(1)

# Mimic the frontend request
# I need a valid series_id from the study
from dicom_viewer.views import _get_dicom_series
all_series = _get_dicom_series(study.local_folder_path)
first_series_id = list(all_series.keys())[0]

data = {
    'study_id': str(study.id),
    'series_id': first_series_id,
    'slice_idx': 0,
    'x': 256,
    'y': 256
}

request = factory.post('/api/dicom/segment/', data=json.dumps(data), content_type='application/json')
# Mocking authentication
from django.contrib.auth import get_user_model
User = get_user_model()
user = User.objects.first()
request.user = user

print(f"Running segment_volume for study={study.id}, series={first_series_id}...")
try:
    response = segment_volume(request)
    if hasattr(response, 'render'):
        response.render()
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Content: {response.content.decode()[:500]}...")
    else:
        print(f"Error Content: {response.content.decode()}")
except Exception as e:
    import traceback
    traceback.print_exc()
