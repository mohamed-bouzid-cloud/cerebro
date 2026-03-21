import os
import sys
import django
import json

# Setup Django
sys.path.append('c:/Users/MSI/Desktop/cerebro')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cerebro.settings')
django.setup()

from dicom_viewer.views import serve_slice as analyze_dicom
from django.test import RequestFactory
from accounts.models import DICOMStudy
from django.http import JsonResponse

factory = RequestFactory()
study = DICOMStudy.objects.first()
if not study:
    print("No studies found.")
    sys.exit(1)

study_id = str(study.id)
print(f"Testing with study: {study_id}")

request = factory.get(f'/api/dicom/analyze/?study_id={study_id}&idx=1')
print("--- [ CEREBRO DEBUG ]: Testing analyze_dicom Endpoint ---")
response = analyze_dicom(request)
if isinstance(response, JsonResponse):
    if response.status_code == 200:
        data = json.loads(response.content)
        print(f"Success! Backend generated the DICOM slice. Total slices: {data.get('total')}")
    else:
        print(f"Failed with {response.status_code}: {response.content}")
else:
    print(f"Failed with non-JSON response: {response.status_code}")
