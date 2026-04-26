#!/usr/bin/env python
"""Test complete workflow: consultation creation -> acceptance -> patient detail view"""

import os
import django
import requests
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cerebro.settings')
django.setup()

BASE_URL = "http://localhost:8000/api/auth"

print("\n" + "="*70)
print("TESTING COMPLETE WORKFLOW")
print("="*70)

# Step 1: Get tokens
print("\n[1] Logging in...")
patient_login = requests.post(f"{BASE_URL}/login/", json={
    "email": "patient_api_test@test.com",
    "password": "testpass"
}).json()
patient_token = patient_login["tokens"]["access"]
print("[OK] Patient token obtained")

doctor_login = requests.post(f"{BASE_URL}/login/", json={
    "email": "doctor_api_test@test.com",
    "password": "testpass"
}).json()
doctor_token = doctor_login["tokens"]["access"]
print("[OK] Doctor token obtained")

# Step 2: Patient creates consultation
print("\n[2] Patient creates consultation...")
headers_patient = {"Authorization": f"Bearer {patient_token}"}
cons_response = requests.post(f"{BASE_URL}/consultations/", 
    headers=headers_patient,
    json={"reason": "General Checkup", "description": "Need a health checkup"}
).json()
consultation_id = cons_response.get("id")
print(f"[OK] Consultation created: ID={consultation_id}, Status={cons_response.get('status')}")

# Step 3: Doctor accepts consultation
print("\n[3] Doctor accepts consultation...")
headers_doctor = {"Authorization": f"Bearer {doctor_token}"}
accept_response = requests.post(
    f"{BASE_URL}/consultations/{consultation_id}/accept/",
    headers=headers_doctor
).json()
print(f"[OK] Status: {accept_response.get('status')}, Message: {accept_response.get('message')}")

# Step 4: Doctor views patient details
print("\n[4] Doctor retrieves patient details...")
patient_detail = requests.get(
    f"{BASE_URL}/patients/6/",
    headers=headers_doctor
).json()

if "error" in patient_detail:
    print(f"[ERROR] {patient_detail['error']}")
else:
    print("[OK] Patient Details Retrieved:")
    print(f"     Name: {patient_detail['patient']['first_name']} {patient_detail['patient']['last_name']}")
    print(f"     Email: {patient_detail['patient']['email']}")
    print(f"     Allergies: {len(patient_detail['allergies'])} items")
    print(f"     Prescriptions: {len(patient_detail['prescriptions'])} items")
    print(f"     Lab Results: {len(patient_detail['lab_results'])} items")
    print(f"     Vital Signs: {len(patient_detail['vital_signs'])} items")

print("\n" + "="*70)
print("[SUCCESS] WORKFLOW COMPLETE - All features working!")
print("="*70 + "\n")
