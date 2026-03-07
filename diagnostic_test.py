#!/usr/bin/env python
"""Comprehensive diagnostic test"""
import requests

print('COMPREHENSIVE DIAGNOSTIC TEST')
print('='*70)

# 1. Test Backend Connectivity
print('\n1. BACKEND CONNECTIVITY')
print('-'*70)
try:
    r = requests.get('http://localhost:8000/api/auth/')
    print(f'✓ Backend responding: {r.status_code}')
except Exception as e:
    print(f'✗ Backend error: {e}')
    exit(1)

# 2. Test Login
print('\n2. AUTHENTICATION')
print('-'*70)
try:
    r = requests.post('http://localhost:8000/api/auth/login/', 
        json={'email':'admin@cerebro.com','password':'admin123456'})
    if r.status_code != 200:
        print(f'✗ Login failed: {r.status_code}')
        print(r.text)
        exit(1)
    token = r.json()['tokens']['access']
    print(f'✓ Login successful')
except Exception as e:
    print(f'✗ Login error: {e}')
    exit(1)

h = {'Authorization': f'Bearer {token}'}

# 3. Test Consultations Endpoint
print('\n3. CONSULTATIONS ENDPOINT')
print('-'*70)
try:
    r = requests.get('http://localhost:8000/api/auth/consultations/', headers=h)
    if r.status_code != 200:
        print(f'✗ Status: {r.status_code}')
        print(r.text)
    else:
        cons = r.json()
        print(f'✓ Status: {r.status_code}')
        print(f'✓ Count: {len(cons)} consultations')
        if cons:
            c = cons[0]
            print(f'Sample: id={c.get("id")}, patient={c.get("patient_name")}, status={c.get("status")}')
except Exception as e:
    print(f'✗ Error: {e}')

# 4. Test FHIR Endpoint
print('\n4. FHIR SERVICEREQUESTS ENDPOINT')
print('-'*70)
try:
    r = requests.get('http://localhost:8000/api/auth/fhir/servicerequests/', headers=h)
    if r.status_code != 200:
        print(f'✗ Status: {r.status_code}')
        print(r.text[:500])
    else:
        fhir = r.json()
        print(f'✓ Status: {r.status_code}')
        print(f'✓ Count: {len(fhir)} FHIR resources')
        if fhir:
            sr = fhir[0]
            print(f'Sample: id={sr.get("id")}, resourceType={sr.get("resourceType")}')
except Exception as e:
    print(f'✗ Error: {e}')

# 5. Test Frontend Connectivity
print('\n5. FRONTEND CONNECTIVITY')
print('-'*70)
try:
    r = requests.get('http://localhost:5173/', timeout=2)
    print(f'✓ Frontend responding: {r.status_code}')
    if 'React' in r.text or '<!DOCTYPE' in r.text:
        print('✓ Frontend is loaded')
except Exception as e:
    print(f'⚠ Frontend: {e}')

print('\n' + '='*70)
print('DIAGNOSIS COMPLETE')
print('='*70)
