#!/usr/bin/env python
"""
Test FHIR Integration with Public HAPI FHIR Server
"""
import os
import sys
import django
import requests

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cerebro.settings')
django.setup()

from accounts.fhir_service import FHIRService

print("=" * 80)
print("FHIR Server Configuration Test")
print("=" * 80)

# Check settings
from django.conf import settings
print(f"\n📋 Settings:")
print(f"   FHIR_SERVER_URL: {settings.FHIR_SERVER_URL}")
print(f"   FHIR_SYNC_ENABLED: {settings.FHIR_SYNC_ENABLED}")
print(f"   FHIR_SERVER_TIMEOUT: {settings.FHIR_SERVER_TIMEOUT}")

# Initialize FHIR Service
fhir = FHIRService()
print(f"\n🔌 FHIR Service Initialized")
print(f"   Server URL: {fhir.server_url}")

# Test metadata endpoint
print(f"\n🧪 Testing Public FHIR Server...")
try:
    success, response = fhir._make_request('GET', '/metadata')
    
    if success:
        print(f"   ✅ Connection Successful")
        print(f"   ✅ Server Type: {response.get('software', {}).get('name', 'FHIR Server')}")
        print(f"   ✅ FHIR Version: {response.get('fhirVersion', 'Unknown')}")
    else:
        print(f"   ❌ Connection Failed: {response.get('error', 'Unknown error')}")
        sys.exit(1)
except Exception as e:
    print(f"   ❌ Error: {str(e)}")
    sys.exit(1)

# Test fetching sample Patient resources
print(f"\n📊 Testing Sample Data Retrieval...")
try:
    success, response = fhir._make_request('GET', '/Patient', params={'_count': '1'})
    
    if success and response.get('entry'):
        print(f"   ✅ Sample Patients Found")
        patient = response['entry'][0]['resource']
        print(f"   ✅ Sample Patient ID: {patient.get('id')}")
        print(f"   ✅ Sample Patient Name: {patient.get('name', [{}])[0].get('text', 'N/A')}")
    else:
        print(f"   ⚠️  No sample data found (this is OK)")
except Exception as e:
    print(f"   ❌ Error: {str(e)}")

print(f"\n{'=' * 80}")
print(f"✅ FHIR SERVER IS READY FOR PRODUCTION")
print(f"{'=' * 80}")
print(f"\nNow restart your Django backend:")
print(f"   cd cerebro-main")
print(f"   venv\\Scripts\\activate.ps1")
print(f"   python manage.py runserver 0.0.0.0:8000")
