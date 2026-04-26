#!/usr/bin/env python
"""Debug accept consultation"""

import os
import django
import requests
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cerebro.settings')
django.setup()

BASE_URL = "http://localhost:8000/api/auth"

# Get tokens
patient_login = requests.post(f"{BASE_URL}/login/", json={
    "email": "patient_api_test@test.com",
    "password": "testpass"
}).json()
patient_token = patient_login["tokens"]["access"]

doctor_login = requests.post(f"{BASE_URL}/login/", json={
    "email": "doctor_api_test@test.com",
    "password": "testpass"
}).json()
doctor_token = doctor_login["tokens"]["access"]

# Create consultation
headers_patient = {"Authorization": f"Bearer {patient_token}"}
cons_response = requests.post(f"{BASE_URL}/consultations/", 
    headers=headers_patient,
    json={"reason": "General Checkup"}
).json()
consultation_id = cons_response.get("id")

# Accept consultation
headers_doctor = {"Authorization": f"Bearer {doctor_token}"}
accept_response = requests.post(
    f"{BASE_URL}/consultations/{consultation_id}/accept/",
    headers=headers_doctor
)

print("[Accept Response]")
print(f"Status Code: {accept_response.status_code}")
print(f"Headers: Content-Type={accept_response.headers.get('Content-Type')}")
print(f"Body:")
try:
    body = accept_response.json()
    print(json.dumps(body, indent=2))
except:
    print(f"Raw text: {accept_response.text[:500]}")
