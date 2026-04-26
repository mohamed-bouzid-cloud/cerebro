import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cerebro.settings')
django.setup()

from accounts.models import User, DoctorAvailability
from datetime import time

def seed_availability():
    doctors = User.objects.filter(role='doctor')
    print(f"Checking {doctors.count()} doctors...")
    
    for doctor in doctors:
        slots_count = DoctorAvailability.objects.filter(doctor=doctor).count()
        if slots_count == 0:
            print(f"Seeding availability for {doctor.get_full_name()}...")
            # Monday to Friday, 08:00 to 18:00
            for day_idx in range(5): 
                DoctorAvailability.objects.get_or_create(
                    doctor=doctor,
                    day_of_week=day_idx,
                    start_time=time(8, 0),
                    end_time=time(18, 0),
                    is_active=True
                )
            print(f"Created 5 slots for {doctor.get_full_name()}.")
        else:
            print(f"{doctor.get_full_name()} already has {slots_count} slots.")

if __name__ == "__main__":
    seed_availability()
