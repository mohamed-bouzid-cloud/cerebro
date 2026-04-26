import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cerebro.settings')
django.setup()

from accounts.models import User

print("\nTesting patient detail access...")
patient = User.objects.get(id=6)
print(f"Patient: {patient.email}")
print(f"Allergies: {patient.allergies.count()}")
print(f"Prescriptions: {patient.prescriptions.count()}")
print("✓ SUCCESS\n")
