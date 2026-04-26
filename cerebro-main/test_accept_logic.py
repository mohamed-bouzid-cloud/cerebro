import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cerebro.settings')
django.setup()

from accounts.models import Consultation, PatientProfile, User

print("\n" + "="*70)
print("TESTING ACCEPT CONSULTATION LOGIC")
print("="*70)

# Get the consultation
consultation = Consultation.objects.get(id=5)
print(f"\n[1] Consultation Details")
print(f"    ID: {consultation.id}")
print(f"    Patient: {consultation.patient.email}")
print(f"    Doctor: {consultation.doctor.email}")
print(f"    Status: {consultation.status}")

# Check patient profile
print(f"\n[2] Patient Profile Check")
try:
    patient_profile = consultation.patient.patient_profile
    print(f"    ✓ Patient profile exists: {patient_profile}")
except AttributeError as e:
    print(f"    ✗ Patient profile missing: {e}")
    print(f"    Creating patient profile...")
    patient_profile = PatientProfile.objects.get_or_create(user=consultation.patient)[0]
    print(f"    ✓ Created: {patient_profile}")

# Try to add doctor to patient's doctors
print(f"\n[3] Adding Doctor to Patient's Doctors List")
try:
    patient_profile.doctors.add(consultation.doctor)
    print(f"    ✓ Doctor added successfully")
    print(f"    Patient's doctors: {list(patient_profile.doctors.all())}")
except Exception as e:
    print(f"    ✗ Error adding doctor: {e}")
    import traceback
    traceback.print_exc()

# Update consultation status
print(f"\n[4] Updating Consultation Status")
consultation.status = "scheduled"
consultation.save()
print(f"    ✓ Status updated to: {consultation.status}")

print("\n" + "="*70)
print("TEST COMPLETE")
print("="*70 + "\n")
