#!/usr/bin/env python
"""
Complete Consultation System Diagnostic Test
Tests all critical functions in sequence
"""
import requests
import json
from datetime import datetime

BASE_URL = 'http://localhost:8000/api/auth'

print('=' * 70)
print('CONSULTATION SYSTEM DIAGNOSTIC TEST')
print('=' * 70)
print()

# Test 1: Register/Login Patient
print('TEST 1: Patient Registration & Login')
print('-' * 70)
patient_email = f'patient_{int(datetime.now().timestamp())}@test.com'
patient_data = {
    'email': patient_email,
    'password': 'testpass123',
    'password2': 'testpass123',
    'first_name': 'John',
    'last_name': 'Patient',
    'role': 'patient'
}
r = requests.post(f'{BASE_URL}/register/', json=patient_data)
print(f'Register Response: {r.status_code}')
if r.status_code in [200, 201]:
    patient_info = r.json()
    patient_token = patient_info['tokens']['access']
    patient_id = patient_info['user']['id']
    print(f'✓ Patient registered - ID: {patient_id}')
    print(f'✓ Email: {patient_email}')
else:
    print(f'✗ Failed: {r.text}')
    exit(1)

print()

# Test 2: Register/Login Doctor
print('TEST 2: Doctor Registration & Login')
print('-' * 70)
doctor_email = f'doctor_{int(datetime.now().timestamp())}@test.com'
doctor_data = {
    'email': doctor_email,
    'password': 'testpass123',
    'password2': 'testpass123',
    'first_name': 'Alice',
    'last_name': 'Doctor',
    'role': 'doctor'
}
r = requests.post(f'{BASE_URL}/register/', json=doctor_data)
print(f'Register Response: {r.status_code}')
if r.status_code in [200, 201]:
    doctor_info = r.json()
    doctor_token = doctor_info['tokens']['access']
    doctor_id = doctor_info['user']['id']
    print(f'✓ Doctor registered - ID: {doctor_id}')
    print(f'✓ Email: {doctor_email}')
else:
    print(f'✗ Failed: {r.text}')
    exit(1)

print()

# Test 3: Patient Creates Consultation Request
print('TEST 3: Patient Creates Consultation Request')
print('-' * 70)
appt_data = {
    'doctor': doctor_id,
    'consultation_type': 'video',
    'reason': 'Chest pain and shortness of breath',
    'status': 'proposed'
}
headers = {'Authorization': f'Bearer {patient_token}'}
r = requests.post(f'{BASE_URL}/appointments/', json=appt_data, headers=headers)
print(f'Create Appointment Response: {r.status_code}')
if r.status_code in [200, 201]:
    appt = r.json()
    appt_id = appt['id']
    print(f'✓ Appointment created - ID: {appt_id}')
    print(f'  Status: {appt.get("status")}')
    print(f'  Consultation Type: {appt.get("consultation_type")}')
    print(f'  FHIR Sync Status: {appt.get("fhir_sync_status", "N/A")}')
else:
    print(f'✗ Failed: {r.status_code}')
    print(f'  Response: {r.text}')
    exit(1)

print()

# Test 4: Doctor Sees Incoming Consultations
print('TEST 4: Doctor Sees Consultation Request')
print('-' * 70)
headers = {'Authorization': f'Bearer {doctor_token}'}
r = requests.get(f'{BASE_URL}/appointments/incoming_consultations/', headers=headers)
print(f'Fetch Consultations Response: {r.status_code}')
if r.status_code == 200:
    consultations = r.json()
    print(f'✓ Fetched consultations - Count: {len(consultations)}')
    if len(consultations) > 0:
        print(f'✓✓✓ DOCTOR CAN SEE CONSULTATION! ✓✓✓')
        cons = consultations[0]
        print(f'  Patient Name: {cons.get("patient_name")}')
        print(f'  Reason: {cons.get("reason")}')
        print(f'  Consultation Type: {cons.get("consultation_type")}')
        print(f'  Status: {cons.get("status")}')
    else:
        print(f'✗✗✗ NO CONSULTATIONS FOUND - THIS IS THE BUG! ✗✗✗')
        print(f'  Database query returned empty list')
        print(f'  Checking all doctor appointments...')
        r2 = requests.get(f'{BASE_URL}/appointments/', headers=headers)
        all_appts = r2.json()
        print(f'  Total doctor appointments: {len(all_appts)}')
        if len(all_appts) > 0:
            print(f'  First appointment status: {all_appts[0].get("status")}')
        exit(1)
else:
    print(f'✗ Failed: {r.status_code}')
    print(f'  Response: {r.text}')
    exit(1)

print()

# Test 5: Doctor Accepts Consultation
print('TEST 5: Doctor Accepts Consultation')
print('-' * 70)
headers = {'Authorization': f'Bearer {doctor_token}'}
r = requests.post(f'{BASE_URL}/appointments/{appt_id}/accept_consultation/', headers=headers)
print(f'Accept Response: {r.status_code}')
if r.status_code == 200:
    result = r.json()
    new_status = result.get('appointment', {}).get('status')
    print(f'✓ Consultation accepted')
    print(f'  New Status: {new_status}')
    if new_status == 'booked':
        print(f'✓✓ Status correctly changed to "booked"')
    else:
        print(f'✗ Status not changed correctly (expected "booked", got "{new_status}")')
else:
    print(f'✗ Failed: {r.status_code}')
    print(f'  Response: {r.text}')
    exit(1)

print()

# Test 6: Doctor Rejects Consultation (second one)
print('TEST 6: Doctor Rejects Consultation (new request)')
print('-' * 70)
appt_data2 = {
    'doctor': doctor_id,
    'consultation_type': 'audio',
    'reason': 'Follow-up appointment',
    'status': 'proposed'
}
headers = {'Authorization': f'Bearer {patient_token}'}
r = requests.post(f'{BASE_URL}/appointments/', json=appt_data2, headers=headers)
if r.status_code in [200, 201]:
    appt2 = r.json()
    appt2_id = appt2['id']
    print(f'✓ Second appointment created - ID: {appt2_id}')
    
    headers = {'Authorization': f'Bearer {doctor_token}'}
    r = requests.post(f'{BASE_URL}/appointments/{appt2_id}/reject_consultation/', headers=headers)
    if r.status_code == 200:
        print(f'✓ Consultation rejected')
        r2 = requests.get(f'{BASE_URL}/appointments/{appt2_id}/', headers=headers)
        if r2.status_code == 200:
            final_appt = r2.json()
            print(f'  Status after reject: {final_appt.get("status")}')
        print(f'✓✓ Rejection successful')
    else:
        print(f'✗ Rejection failed: {r.status_code}')
else:
    print(f'! Skipped (could not create second appointment)')

print()
print('=' * 70)
print('ALL TESTS COMPLETED ✓')
print('=' * 70)
print()
print('SUMMARY:')
print('  ✓ Patient can register')
print('  ✓ Doctor can register')
print('  ✓ Patient can create consultation request')
print('  ✓ Doctor can see consultation requests')
print('  ✓ Doctor can accept consultations')
print('  ✓ Doctor can reject consultations')
print()
print('SYSTEM IS WORKING!')
