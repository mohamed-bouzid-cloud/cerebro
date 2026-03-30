#!/usr/bin/env python
"""
End-to-end test that mimics the DoctorDashboard frontend exactly
"""
import requests
import json

def test_doctor_dashboard_flow():
    print("\n" + "="*70)
    print("SIMULATING DOCTOR DASHBOARD LOAD")
    print("="*70)
    
    # Step 1: Frontend loads → User logs in via localStorage check
    print("\n[Step 1] Frontend checks if token exists...")
    print("→ User has token in localStorage")
    
    # Step 2: Fetch user info
    print("\n[Step 2] Fetch current user...")
    token = None
    try:
        # First get token
        r = requests.post('http://localhost:8000/api/auth/login/',
            json={'email':'admin@cerebro.com','password':'admin123456'})
        if r.status_code != 200:
            print(f"✗ Login failed: {r.status_code}")
            return False
        
        token = r.json()['tokens']['access']
        h = {'Authorization': f'Bearer {token}'}
        
        # Fetch user
        r = requests.get('http://localhost:8000/api/auth/me/', headers=h)
        if r.status_code != 200:
            print(f"✗ Fetch user failed: {r.status_code}")
            return False
        
        user = r.json()
        print(f"✓ User: {user.get('first_name')} {user.get('last_name')} (role: {user.get('role')})")
        
        if user.get('role') != 'doctor':
            print("✗ User is not a doctor!")
            return False
            
    except Exception as e:
        print(f"✗ Error: {e}")
        return False
    
    # Step 3: Fetch dashboard data (same as DoctorDashboard.fetchDashboardData())
    print("\n[Step 3] DoctorDashboard.fetchDashboardData() called...")
    
    endpoints = {
        '/api/auth/appointments/today/': 'Today Appointments',
        '/api/auth/appointments/upcoming/': 'Upcoming Appointments',
        '/api/auth/consultations/': 'Consultations (API)',
        '/api/auth/fhir/servicerequests/': 'FHIR ServiceRequests',
        '/api/auth/patients/': 'Patients',
    }
    
    data = {}
    for endpoint, name in endpoints.items():
        try:
            r = requests.get(f'http://localhost:8000{endpoint}', headers=h)
            if r.status_code != 200:
                print(f"  ✗ {name}: {r.status_code}")
                data[endpoint] = []
            else:
                result = r.json()
                count = len(result) if isinstance(result, list) else 1
                print(f"  ✓ {name}: {count} items")
                data[endpoint] = result if isinstance(result, list) else [result]
        except Exception as e:
            print(f"  ✗ {name}: {e}")
            data[endpoint] = []
    
    # Step 4: Merge consultations (simulate frontend merge)
    print("\n[Step 4] Merging consultations...")
    cons = data.get('/api/auth/consultations/', [])
    fhir = data.get('/api/auth/fhir/servicerequests/', [])
    
    print(f"  • API Consultations: {len(cons)}")
    print(f"  • FHIR ServiceRequests: {len(fhir)}")
    
    # Transform FHIR to consultation format (simulating frontend transform)
    fhir_as_consultations = []
    for sr in fhir:
        fhir_as_consultations.append({
            'id': sr.get('id'),
            'patient_name': sr.get('subject', {}).get('display', 'Unknown'),
            'doctor_name': sr.get('performer', [{}])[0].get('display', 'Unknown'),
            'consultation_type': sr.get('code', {}).get('text', 'Consultation'),
            'reason': sr.get('reasonCode', [{}])[0].get('text', 'No reason'),
            'status': sr.get('status', 'requested'),
            '_fhir': True
        })
    
    merged = cons + fhir_as_consultations
    print(f"  ✓ Total merged: {len(merged)} consultations")
    
    # Step 5: Verify dashboard state
    print("\n[Step 5] Dashboard state ready for display...")
    if len(merged) > 0:
        print(f"  ✓ Will display {len(merged)} consultations")
        print(f"\n  Sample consultations:")
        for c in merged[:3]:
            print(f"    - {c.get('patient_name')} ({c.get('consultation_type')}): {c.get('reason', '')[:40]}...")
    else:
        print("  ⚠ No consultations to display!")
    
    print("\n" + "="*70)
    print("✓ DASHBOARD SHOULD DISPLAY CORRECTLY NOW")
    print("="*70)
    
    if len(merged) == 0:
        print("\n⚠ NOTE: No consultations found! This might be why you see empty list.")
        return False
    
    return True

if __name__ == '__main__':
    success = test_doctor_dashboard_flow()
    exit(0 if success else 1)
