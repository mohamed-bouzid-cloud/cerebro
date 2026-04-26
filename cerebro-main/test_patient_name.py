#!/usr/bin/env python
"""Test if patient_name is returned in API responses"""
import requests
from datetime import datetime

BASE_URL = 'http://localhost:8000/api/auth'

print("=" * 70)
print("TESTING PATIENT NAME IN APPOINTMENT RESPONSES")
print("=" * 70)
print()

# Create test users
patient_email = f'pat_{int(datetime.now().timestamp())}@test.com'
doctor_email = f'doc_{int(datetime.now().timestamp())}@test.com'

print("1. Registering patient...")
patient_r = requests.post(f'{BASE_URL}/register/', json={
    'email': patient_email,
    'password': 'testpass123',
    'password2': 'testpass123',
    'first_name': 'John',
    'last_name': 'Doe',
    'role': 'patient'
})
patient_data = patient_r.json()
patient_token = patient_data['tokens']['access']
patient_id = patient_data['user']['id']
print(f"✓ Patient created: ID={patient_id}, Name: {patient_data['user']['first_name']} {patient_data['user']['last_name']}")
print()

print("2. Registering doctor...")
doctor_r = requests.post(f'{BASE_URL}/register/', json={
    'email': doctor_email,
    'password': 'testpass123',
    'password2': 'testpass123',
    'first_name': 'Alice',
    'last_name': 'Smith',
    'role': 'doctor'
})
doctor_data = doctor_r.json()
doctor_token = doctor_data['tokens']['access']
doctor_id = doctor_data['user']['id']
print(f"✓ Doctor created: ID={doctor_id}, Name: {doctor_data['user']['first_name']} {doctor_data['user']['last_name']}")
print()

print("3. Patient creates consultation request...")
appt_r = requests.post(f'{BASE_URL}/appointments/', json={
    'doctor': doctor_id,
    'consultation_type': 'video',
    'reason': 'Test consultation reason',
    'status': 'proposed'
}, headers={'Authorization': f'Bearer {patient_token}'})

if appt_r.status_code != 201:
    print(f"✗ Failed to create appointment: {appt_r.status_code}")
    print(f"  Response: {appt_r.json()}")
    exit(1)

appt = appt_r.json()
appt_id = appt['id']
print(f"✓ Appointment created: ID={appt_id}")
print(f"  Fields in response:")
for key in ['id', 'patient', 'patient_name', 'doctor', 'doctor_name', 'status', 'consultation_type']:
    print(f"    {key}: {appt.get(key)}")
print()

print("4. Doctor fetches incoming consultations...")
consult_r = requests.get(f'{BASE_URL}/appointments/incoming_consultations/',
    headers={'Authorization': f'Bearer {doctor_token}'})

if consult_r.status_code != 200:
    print(f"✗ Failed to fetch consultations: {consult_r.status_code}")
    exit(1)

consultations = consult_r.json()
print(f"✓ Doctor fetched {len(consultations)} consultations")
print()

if len(consultations) > 0:
    cons = consultations[0]
    print("✓✓ FIRST CONSULTATION FIELDS:")
    for key in ['id', 'patient', 'patient_name', 'doctor', 'doctor_name', 'status', 'reason']:
        value = cons.get(key)
        if key == 'patient_name':
            if value:
                print(f"    {key}: '{value}' ✓✓✓ PATIENT NAME IS HERE!")
            else:
                print(f"    {key}: {value} ✗✗✗ PATIENT NAME IS MISSING!")
        else:
            print(f"    {key}: {value}")
else:
    print("✗ No consultations returned!")

print()
print("=" * 70)
print("TEST COMPLETE")
print("=" * 70)
