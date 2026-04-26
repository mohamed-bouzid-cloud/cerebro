import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cerebro.settings')
django.setup()

from accounts.models import User, DoctorAvailability
from datetime import time

def seed_full_availability():
    doctors = User.objects.filter(role='doctor')
    print(f"Enabling 24/7 availability for {doctors.count()} doctors...")
    
    for doctor in doctors:
        # Clear existing to be sure
        DoctorAvailability.objects.filter(doctor=doctor).delete()
        for day in range(7):
            DoctorAvailability.objects.create(
                doctor=doctor,
                day_of_week=day,
                start_time=time(0, 0),
                end_time=time(23, 59),
                is_active=True
            )
        print(f"Enabled 7-day availability for {doctor.get_full_name()}.")

if __name__ == "__main__":
    seed_full_availability()
