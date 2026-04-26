#!/usr/bin/env python
"""
Test the actual API appointment creation endpoint
"""

import os
import django
import json
from io import BytesIO

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cerebro.settings')
django.setup()

from django.test import RequestFactory
from rest_framework.test import force_authenticate
from accounts.views import AppointmentViewSet
from accounts.models import User, DoctorProfile, Appointment
from datetime import datetime, timedelta
from django.utils import timezone

print("\n" + "="*60)
print("API ENDPOINT TEST - APPOINTMENT CREATION")
print("="*60)

# Create users
print("\n[1] Setting up users...")
patient, _ = User.objects.get_or_create(
    email='patient_api_test@test.com',
    defaults={'role': 'patient', 'first_name': 'PatientAPI', 'last_name': 'Test'}
)
patient.set_password('testpass')
patient.save()

doctor, _ = User.objects.get_or_create(
    email='doctor_api_test@test.com',
    defaults={'role': 'doctor', 'first_name': 'DoctorAPI', 'last_name': 'Test'}
)
doctor.set_password('testpass')
doctor.save()

if not hasattr(doctor, 'doctor_profile'):
    DoctorProfile.objects.create(user=doctor, specialty="Surgery")

print(f"✓ Patient: {patient.id}")
print(f"✓ Doctor: {doctor.id}")

# Create POST request like the frontend does
print("\n[2] Creating POST request with doctor field...")

factory = RequestFactory()
request_data = {
    'doctor': doctor.id,
    'scheduled_at': (timezone.now() + timedelta(days=1)).isoformat(),
    'duration_minutes': 30,
    'status': 'scheduled',
    'notes': 'Test appointment from API'
}

print(f"   Request data: {request_data}")

request = factory.post(
    '/api/auth/appointments/',
    data=json.dumps(request_data),
    content_type='application/json'
)
force_authenticate(request, user=patient)

# Call the viewset
print("\n[3] Calling viewset create method...")
viewset = AppointmentViewSet()
viewset.request = request
viewset.format_kwarg = None

try:
    response = viewset.create(request)
    print(f"✓ Response status: {response.status_code}")
    print(f"  Response data: {response.data}")
    
    if response.status_code == 201:
        apt_id = response.data.get('id')
        appointment = Appointment.objects.get(id=apt_id)
        print(f"\n[4] Appointment created successfully!")
        print(f"  - ID: {appointment.id}")
        print(f"  - Patient: {appointment.patient.email}")
        print(f"  - Doctor: {appointment.doctor.email if appointment.doctor else 'NULL!'}")
        print(f"  - Status: {appointment.status}")
        
        # Check if doctor can see it
        doctor_apts = Appointment.objects.filter(doctor=doctor)
        print(f"\n[5] Doctor's queryset filter result:")
        print(f"  - Doctor can see this appointment: {appointment in doctor_apts}")
    else:
        print(f"✗ API returned error status {response.status_code}")
        
except Exception as e:
    print(f"✗ ERROR: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)
