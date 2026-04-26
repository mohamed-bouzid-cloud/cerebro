from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import PatientProfile, DoctorProfile

User = get_user_model()

class Command(BaseCommand):
    help = 'Add test patients and assign them to the first doctor'

    def handle(self, *args, **options):
        # Get or create the doctor user
        doctor_user, created = User.objects.get_or_create(
            email='sarah.mitchell@doctor.com',
            defaults={
                'first_name': 'Sarah',
                'last_name': 'Mitchell',
                'role': 'doctor'
            }
        )
        
        # Ensure doctor has a profile
        doctor_profile, _ = DoctorProfile.objects.get_or_create(
            user=doctor_user,
            defaults={
                'specialty': 'Cardiology',
                'license_number': 'MD-123456'
            }
        )
        
        patients_data = [
            {
                'email': 'john.doe@patient.com',
                'first_name': 'John',
                'last_name': 'Doe'
            },
            {
                'email': 'jane.smith@patient.com',
                'first_name': 'Jane',
                'last_name': 'Smith'
            },
            {
                'email': 'robert.johnson@patient.com',
                'first_name': 'Robert',
                'last_name': 'Johnson'
            },
            {
                'email': 'emily.williams@patient.com',
                'first_name': 'Emily',
                'last_name': 'Williams'
            },
            {
                'email': 'michael.brown@patient.com',
                'first_name': 'Michael',
                'last_name': 'Brown'
            },
            {
                'email': 'sarah.davis@patient.com',
                'first_name': 'Sarah',
                'last_name': 'Davis'
            },
            {
                'email': 'david.wilson@patient.com',
                'first_name': 'David',
                'last_name': 'Wilson'
            },
            {
                'email': 'lisa.anderson@patient.com',
                'first_name': 'Lisa',
                'last_name': 'Anderson'
            },
            {
                'email': 'james.martinez@patient.com',
                'first_name': 'James',
                'last_name': 'Martinez'
            },
            {
                'email': 'amanda.taylor@patient.com',
                'first_name': 'Amanda',
                'last_name': 'Taylor'
            }
        ]
        
        count = 0
        for patient_data in patients_data:
            try:
                # Create or get patient user
                patient_user, created = User.objects.get_or_create(
                    email=patient_data['email'],
                    defaults={
                        'first_name': patient_data['first_name'],
                        'last_name': patient_data['last_name'],
                        'role': 'patient'
                    }
                )
                
                # Ensure patient has a profile
                patient_profile, _ = PatientProfile.objects.get_or_create(
                    user=patient_user,
                    defaults={
                        'blood_type': 'O+',
                        'date_of_birth': '1990-01-01'
                    }
                )
                
                # Assign patient to doctor
                patient_profile.doctors.add(doctor_user)
                count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Created and assigned patient: {patient_data["first_name"]} {patient_data["last_name"]}'
                    )
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'✗ Error with {patient_data["email"]}: {str(e)}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'\n✅ Successfully added and assigned {count} patients to Dr. {doctor_user.first_name} {doctor_user.last_name}')
        )
