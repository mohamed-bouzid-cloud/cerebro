#!/usr/bin/env python
"""Debug consultation creation"""

import os
import django
import requests
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cerebro.settings')
django.setup()

BASE_URL = "http://localhost:8000/api/auth"

# Get patient token
patient_login = requests.post(f"{BASE_URL}/login/", json={
    "email": "patient_api_test@test.com",
    "password": "testpass"
}).json()
patient_token = patient_login["tokens"]["access"]

# Create consultation
headers_patient = {"Authorization": f"Bearer {patient_token}"}
cons_response = requests.post(f"{BASE_URL}/consultations/", 
    headers=headers_patient,
    json={"reason": "General Checkup", "description": "Need a health checkup"}
)

print("[Consultation Create Response]")
print(f"Status: {cons_response.status_code}")
if cons_response.status_code >= 400:
    # Try to parse as JSON first
    try:
        body = cons_response.json()
        print(f"Body: {json.dumps(body, indent=2)}")
    except:
        # If it's HTML (error page), show the text
        print(f"Body (HTML):")
        print(cons_response.text[:2000])  # First 2000 chars
else:
    print(f"Body: {json.dumps(cons_response.json(), indent=2)}")
