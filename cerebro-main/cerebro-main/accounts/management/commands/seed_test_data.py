from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import DoctorProfile, PatientProfile
from datetime import datetime

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed test patients and assign them to a doctor'

    def add_arguments(self, parser):
        parser.add_argument('--doctor-email', type=str, default='doctor@test.com',
                          help='Email of the doctor to assign patients to')

    def handle(self, *args, **options):
        doctor_email = options['doctor_email']
        
        # Get or create doctor
        try:
            doctor = User.objects.get(email=doctor_email, role='doctor')
            self.stdout.write(f"Found doctor: {doctor.get_full_name()}")
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"Doctor with email {doctor_email} not found"))
            return

        # Create test patients
        test_patients = [
            {
                'first_name': 'John',
                'last_name': 'Doe',
                'email': 'john.doe@patient.com',
                'date_of_birth': '1990-05-15',
                'phone_number': '+1-555-0101',
            },
            {
                'first_name': 'Jane',
                'last_name': 'Smith',
                'email': 'jane.smith@patient.com',
                'date_of_birth': '1985-08-22',
                'phone_number': '+1-555-0102',
            },
            {
                'first_name': 'Robert',
                'last_name': 'Johnson',
                'email': 'robert.johnson@patient.com',
                'date_of_birth': '1992-03-10',
                'phone_number': '+1-555-0103',
            },
            {
                'first_name': 'Emily',
                'last_name': 'Williams',
                'email': 'emily.williams@patient.com',
                'date_of_birth': '1988-11-30',
                'phone_number': '+1-555-0104',
            },
            {
                'first_name': 'Michael',
                'last_name': 'Brown',
                'email': 'michael.brown@patient.com',
                'date_of_birth': '1995-07-14',
                'phone_number': '+1-555-0105',
            },
        ]

        created_count = 0
        for patient_data in test_patients:
            email = patient_data.pop('email')
            date_of_birth = patient_data.pop('date_of_birth')
            phone_number = patient_data.pop('phone_number')

            # Create or get user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'role': 'patient',
                    **patient_data
                }
            )

            if created:
                user.set_password('testpass123')
                user.save()
                self.stdout.write(self.style.SUCCESS(f"✓ Created patient: {user.get_full_name()} ({email})"))
                created_count += 1
            else:
                self.stdout.write(f"Patient already exists: {user.get_full_name()} ({email})")

            # Get or create patient profile
            patient_profile, _ = PatientProfile.objects.get_or_create(
                user=user,
                defaults={
                    'date_of_birth': date_of_birth,
                    'phone_number': phone_number,
                    'blood_type': 'O+'
                }
            )

            # Assign to doctor
            patient_profile.doctors.add(doctor)

        self.stdout.write(self.style.SUCCESS(f"\n✓ Successfully created {created_count} test patients"))
        self.stdout.write(self.style.SUCCESS(f"✓ All patients assigned to Dr. {doctor.get_full_name()}"))
        self.stdout.write("\nTest patient credentials:")
        for patient_data in test_patients:
            self.stdout.write(f"  Email: {patient_data['email']}, Password: testpass123")
