from django.core.management.base import BaseCommand
from accounts.models import User, PatientProfile, DoctorProfile, DICOMStudy
from datetime import date, timedelta
import random
from django.utils import timezone

class Command(BaseCommand):
    help = 'Seeds fake patients and links them to a specified doctor for testing'

    def handle(self, *args, **options):
        # 1. Get all doctors
        doctors = User.objects.filter(role='doctor')
        
        if not doctors.exists():
            doctor = User.objects.create_user(
                email='doctor@cerebro.com',
                password='password123',
                first_name='Dr. Strange',
                last_name='Sorcerer',
                role='doctor'
            )
            DoctorProfile.objects.create(
                user=doctor,
                specialty='Neurology'
            )
            doctors = [doctor]
            self.stdout.write(self.style.SUCCESS('Created new default doctor'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Found {doctors.count()} existing doctors'))

        # 2. Create fake patients
        fake_patients_data = [
            {"first_name": "Tony", "last_name": "Stark", "email": "tony@stark.com", "phone": "555-0100"},
            {"first_name": "Steve", "last_name": "Rogers", "email": "steve@avengers.com", "phone": "555-0101"},
            {"first_name": "Bruce", "last_name": "Banner", "email": "bruce@hulksmash.com", "phone": "555-0102"},
            {"first_name": "Natasha", "last_name": "Romanoff", "email": "natasha@shield.com", "phone": "555-0103"},
            {"first_name": "Thor", "last_name": "Odinson", "email": "thor@asgard.com", "phone": "555-0104"},
            {"first_name": "Wanda", "last_name": "Maximoff", "email": "wanda@hex.com", "phone": "555-0105"},
            {"first_name": "Peter", "last_name": "Parker", "email": "peter@dailybugle.com", "phone": "555-0106"},
        ]

        patients_created = 0
        for patient_data in fake_patients_data:
            # Check if patient exists
            patient = User.objects.filter(email=patient_data['email']).first()
            if not patient:
                patient = User.objects.create_user(
                    email=patient_data['email'],
                    password='password123',
                    first_name=patient_data['first_name'],
                    last_name=patient_data['last_name'],
                    role='patient'
                )
                
                # Create profile
                profile = PatientProfile.objects.create(
                    user=patient,
                    date_of_birth=date(1980 + random.randint(0, 30), random.randint(1, 12), random.randint(1, 28)),
                    phone_number=patient_data['phone']
                )
                
                patients_created += 1
            else:
                profile = patient.patient_profile

            # Assign to backend doctors
            for doc in doctors:
                profile.doctors.add(doc)

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {patients_created} new patients and linked them to all doctors!'))
