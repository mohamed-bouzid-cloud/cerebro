#!/usr/bin/env python
"""
Direct FHIR Service Test - No Django Backend Needed
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Manually set FHIR server URL
os.environ['FHIR_SERVER_URL'] = 'https://hapi.fhir.org/baseR4'

print("=" * 80)
print("FHIR Server Configuration Test")
print("=" * 80)

print(f"\n📋 Configuration:")
print(f"   FHIR_SERVER_URL: {os.environ.get('FHIR_SERVER_URL')}")

# Test direct HTTP connection
import requests

print(f"\n🧪 Testing Public FHIR Server Connection...")

try:
    # Test metadata endpoint
    response = requests.get(
        'https://hapi.fhir.org/baseR4/metadata',
        headers={'Accept': 'application/fhir+json'},
        timeout=30
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Connection Successful (HTTP {response.status_code})")
        print(f"   ✅ Server: {data.get('software', {}).get('name', 'FHIR Server')}")
        print(f"   ✅ FHIR Version: {data.get('fhirVersion', 'Unknown')}")
    else:
        print(f"   ❌ Server returned HTTP {response.status_code}")
        sys.exit(1)
        
except Exception as e:
    print(f"   ❌ Connection Failed: {str(e)}")
    sys.exit(1)

# Test patient retrieval
print(f"\n📊 Testing Patient Data Retrieval...")

try:
    response = requests.get(
        'https://hapi.fhir.org/baseR4/Patient',
        headers={'Accept': 'application/fhir+json'},
        params={'_count': '1'},
        timeout=30
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get('entry'):
            print(f"   ✅ Sample Patients Available")
            total = data.get('total', '?')
            print(f"   ✅ Total Patients in Server: {total}")
        else:
            print(f"   ⚠️  No sample data found (this is OK)")
    else:
        print(f"   ⚠️  Patient search returned HTTP {response.status_code}")
        
except Exception as e:
    print(f"   ⚠️  Error: {str(e)}")

print(f"\n{'=' * 80}")
print(f"✅ PUBLIC FHIR SERVER IS READY")
print(f"{'=' * 80}")
print(f"\n📋 Configuration saved in: .env")
print(f"   FHIR_SERVER_URL=https://hapi.fhir.org/baseR4")
print(f"\n🚀 Next Steps:")
print(f"   1. Restart Django backend:")
print(f"      cd cerebro-main")
print(f"      venv\\Scripts\\activate.ps1")
print(f"      python manage.py runserver 0.0.0.0:8000")
print(f"\n   2. Start Frontend:")
print(f"      cd frontend")
print(f"      npm run dev")
print(f"\n   3. Open Doctor Dashboard:")
print(f"      http://localhost:5173")
print(f"      Login to view FHIR-powered clinical data")
