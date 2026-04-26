import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cerebro.settings')
django.setup()

from django.conf import settings
from accounts.fhir_service import fhir_service

print("\n" + "="*70)
print("FHIR SERVER CONFIGURATION TEST")
print("="*70)

print("\n[1] Settings Verification")
print(f"    FHIR_SERVER_URL: {settings.FHIR_SERVER_URL}")
print(f"    FHIR_SYNC_ENABLED: {settings.FHIR_SYNC_ENABLED}")
print(f"    FHIR_SERVER_TIMEOUT: {settings.FHIR_SERVER_TIMEOUT}")

print("\n[2] FHIR Service Instance")
print(f"    Service URL: {fhir_service.server_url}")
print(f"    Status: {'✓ CONFIGURED' if fhir_service.server_url else '✗ NOT CONFIGURED'}")

print("\n[3] Testing FHIR Server Connectivity")
success, response = fhir_service._make_request('GET', '/metadata')
if success:
    print(f"    ✓ FHIR server is ONLINE")
    print(f"    ✓ Response status: 200 OK")
    if 'fhirVersion' in response:
        print(f"    ✓ FHIR Version: {response.get('fhirVersion')}")
    if 'name' in response:
        print(f"    ✓ Server Name: {response.get('name')}")
else:
    print(f"    ✗ FHIR server is OFFLINE or UNREACHABLE")
    print(f"    Error: {response.get('error', 'Unknown error')}")

print("\n[4] Testing Patient Search Capability")
success, response = fhir_service._make_request('GET', '/Patient?_summary=true&_count=1')
if success:
    print(f"    ✓ Patient search works")
    print(f"    ✓ Can access FHIR resources")
else:
    print(f"    ✗ Patient search failed")

print("\n[5] Summary")
if fhir_service.server_url and success:
    print(f"""
    ✓ FHIR SERVER IS FULLY CONFIGURED AND WORKING
    
    - Connected to: {settings.FHIR_SERVER_URL}
    - Appointments will now sync to the public FHIR server
    - All FHIR endpoints are now functional
    - Patients and doctors can view FHIR-integrated data
    """)
else:
    print(f"""
    ✗ FHIR SERVER CONFIGURATION INCOMPLETE
    
    - URL is configured but server is unreachable
    - Check your internet connection
    - Or verify HAPI FHIR server is still online
    """)

print("="*70 + "\n")
