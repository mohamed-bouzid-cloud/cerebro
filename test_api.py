<<<<<<< HEAD
#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cerebro.settings')
django.setup()

from accounts.models import User
from rest_framework_simplejwt.tokens import RefreshToken
import json

# Get or create a test user
user = User.objects.filter(email='test@example.com').first()
if not user:
    user = User.objects.create_user(email='test@example.com', password='testpass123', 
                                    first_name='Test', last_name='User', role='patient')

# Generate token
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)

print("=" * 60)
print("TEST API CREDENTIALS")
print("=" * 60)
print(f"User: {user.email} ({user.role})")
print(f"Access Token: {access_token[:50]}...")
print()
print("=" * 60)
print("API ENDPOINTS TO TEST")
print("=" * 60)
print(f"GET http://localhost:8001/api/auth/dicom-studies/")
print(f"GET http://localhost:8001/api/auth/hl7-messages/")
print(f"GET http://localhost:8001/api/auth/fhir-logs/")
print(f"GET http://localhost:8001/api/auth/fhir/export/patient/")
print()
print("Header to use:")
print(f"Authorization: Bearer {access_token}")
print("=" * 60)
=======
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
>>>>>>> dcc8718832808e12203694ff91ad11bc675c1868
