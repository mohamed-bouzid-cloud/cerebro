import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cerebro.settings')
django.setup()

from accounts.models import Appointment, FHIRResourceLog, User
from django.utils import timezone

def verify():
    # 1. Check Appointment status choices
    print("--- 1. Checking Appointment Model ---")
    status_choices = [c[0] for c in Appointment.STATUS_CHOICES]
    print(f"Status choices: {status_choices}")
    expected = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show']
    for e in expected:
        if e in status_choices:
            print(f"✓ {e} is present")
        else:
            print(f"✗ {e} is MISSING")

    # 2. Check Signals & FHIR Sync
    print("\n--- 2. Checking FHIR Sync Signal ---")
    patient = User.objects.filter(role='patient').first()
    doctor = User.objects.filter(role='doctor').first()
    
    if not patient or not doctor:
        print("✗ Could not find patient/doctor to test signal")
        return

    # Create a test appointment
    apt = Appointment.objects.create(
        patient=patient,
        doctor=doctor,
        scheduled_at=timezone.now(),
        status='scheduled',
        notes='Test verification appointment'
    )
    print(f"Created test appointment ID: {apt.id}")
    
    # Check if FHIR log was created
    log = FHIRResourceLog.objects.filter(
        resource_type="Appointment",
        local_object_id=str(apt.id)
    ).first()
    
    if log:
        print(f"✓ FHIR Log created for Appointment {apt.id}")
        print(f"Payload Status: {log.fhir_payload.get('status')}")
    else:
        print(f"✗ No FHIR Log found for Appointment {apt.id}")

    # Update status to confirmed
    apt.status = 'confirmed'
    apt.save()
    print("Updated status to 'confirmed'")
    
    log.refresh_from_db()
    print(f"Updated FHIR Payload Status: {log.fhir_payload.get('status')}")
    
    # Cleanup
    # apt.delete()
    # log.delete()

if __name__ == "__main__":
    verify()
