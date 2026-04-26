#!/usr/bin/env python
"""
Test script to diagnose the appointment dashboard issue.
Run with: python manage.py shell < test_appointment_issue.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cerebro.settings')
django.setup()

from accounts.models import User, Appointment, DoctorProfile
from datetime import datetime, timedelta
from django.utils import timezone

print("\n" + "="*60)
print("APPOINTMENT DASHBOARD BUG TEST")
print("="*60)

# Step 1: Create test users
print("\n[1] Creating test users...")
patient, _ = User.objects.get_or_create(
    email='patient_test@test.com',
    defaults={'role': 'patient', 'first_name': 'Patient', 'last_name': 'Test'}
)
patient.set_password('testpass123')
patient.save()
print(f"✓ Patient created: {patient.email}")

doctor, _ = User.objects.get_or_create(
    email='doctor_test@test.com',
    defaults={'role': 'doctor', 'first_name': 'Doctor', 'last_name': 'Test'}
)
doctor.set_password('testpass123')
doctor.save()
print(f"✓ Doctor created: {doctor.email}")

# Create doctor profile if needed
if not hasattr(doctor, 'doctor_profile'):
    DoctorProfile.objects.create(user=doctor, specialty="General Practice")
print(f"✓ Doctor profile exists")

# Step 2: Create an appointment as the patient would
print("\n[2] Creating appointment (simulating patient)...")
try:
    appointment = Appointment.objects.create(
        patient=patient,
        doctor=doctor,
        scheduled_at=timezone.now() + timedelta(days=1),
        duration_minutes=30,
        status="scheduled",
        notes="Test appointment"
    )
    print(f"✓ Appointment created: ID={appointment.id}")
    print(f"  - Patient: {appointment.patient.email}")
    print(f"  - Doctor: {appointment.doctor.email}")
    print(f"  - Status: {appointment.status}")
except Exception as e:
    print(f"✗ FAILED to create appointment: {e}")
    exit(1)

# Step 3: Test get_queryset filtering
print("\n[3] Testing get_queryset filtering...")

# What the doctor should see
doctor_appointments = Appointment.objects.filter(doctor=doctor)
print(f"✓ Doctor's appointments (filter by doctor=user): {doctor_appointments.count()}")
if doctor_appointments.exists():
    for apt in doctor_appointments:
        print(f"  - {apt.patient.email} with Dr. {apt.doctor.email}")
else:
    print("  ✗ NO APPOINTMENTS FOUND FOR DOCTOR!")

# What the patient should see
patient_appointments = Appointment.objects.filter(patient=patient)
print(f"✓ Patient's appointments (filter by patient=user): {patient_appointments.count()}")
if patient_appointments.exists():
    for apt in patient_appointments:
        print(f"  - {apt.patient.email} with Dr. {apt.doctor.email}")
else:
    print("  ✗ NO APPOINTMENTS FOUND FOR PATIENT!")

# Step 4: Check database state
print("\n[4] Checking database state...")
print(f"✓ Total appointments in DB: {Appointment.objects.count()}")
print(f"✓ Appointments with doctor field NULL: {Appointment.objects.filter(doctor__isnull=True).count()}")

all_apts = Appointment.objects.all()
for apt in all_apts:
    print(f"  - APT {apt.id}: Patient={apt.patient.email}, Doctor={apt.doctor.email if apt.doctor else 'NULL'}")

# Step 5: Test serializer
print("\n[5] Testing AppointmentSerializer...")
from accounts.serializers import AppointmentSerializer

serializer = AppointmentSerializer(appointment)
print(f"✓ Serialized data keys: {list(serializer.data.keys())}")
print(f"  - doctor: {serializer.data.get('doctor')}")
print(f"  - patient: {serializer.data.get('patient')}")

# Step 6: Summary
print("\n" + "="*60)
print("DIAGNOSIS")
print("="*60)

if doctor_appointments.exists():
    print("✓ APPOINTMENTS ARE APPEARING IN DOCTOR DASHBOARD")
    print("  The issue might be in the frontend or API filtering.")
else:
    print("✗ APPOINTMENTS ARE NOT APPEARING IN DOCTOR DASHBOARD")
    print("  The issue is in the backend save logic.")
    
print("\nCheck the above output for errors.")
print("="*60 + "\n")
