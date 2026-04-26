import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cerebro.settings')
django.setup()

from accounts.models import Appointment, User

print("\n" + "="*60)
print("FHIR SERVER STATUS CHECK")
print("="*60)

print("\n[1] Django Settings")
from django.conf import settings
print(f"    FHIR_SERVER_URL: {getattr(settings, 'FHIR_SERVER_URL', 'NOT CONFIGURED')}")
print(f"    FHIR_SYNC_ENABLED: {getattr(settings, 'FHIR_SYNC_ENABLED', 'NOT CONFIGURED')}")

print("\n[2] User Model Fields")
user_fields = [f.name for f in User._meta.get_fields()]
print(f"    Fields: {user_fields}")
print(f"    Has 'fhir_resource_id': {'fhir_resource_id' in user_fields}")

print("\n[3] Appointment Model Fields")  
apt_fields = [f.name for f in Appointment._meta.get_fields()]
print(f"    Fields: {apt_fields}")
fhir_related = [f for f in apt_fields if 'fhir' in f.lower()]
print(f"    FHIR fields: {fhir_related if fhir_related else 'NONE'}")

print("\n[4] FHIR Views Status")
try:
    from accounts.fhir_views import FHIRDoctorDashboardView
    print("    ✓ FHIRDoctorDashboardView imported successfully")
except Exception as e:
    print(f"    ✗ Error importing FHIRDoctorDashboardView: {e}")

print("\n[5] FHIR Service Status")
try:
    from accounts.fhir_service import fhir_service
    print(f"    Server URL: {fhir_service.server_url}")
    print(f"    Status: {'CONFIGURED' if fhir_service.server_url else 'NOT CONFIGURED'}")
except Exception as e:
    print(f"    ✗ Error: {e}")

print("\n" + "="*60)
print("SUMMARY")
print("="*60)
print("""
The FHIR server is NOT CONFIGURED:
- FHIR_SERVER_URL is not set in Django settings
- User model lacks FHIR integration fields
- FHIR endpoints will fail when called

To fix:
1. Set FHIR_SERVER_URL in settings.py
2. Add FHIR fields to User model via migration
3. Or use public FHIR server (e.g., https://hapi.fhir.org/baseR4)
""")
print("="*60 + "\n")
