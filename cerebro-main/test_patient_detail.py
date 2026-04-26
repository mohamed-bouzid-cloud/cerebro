import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cerebro.settings')
django.setup()

from accounts.models import User, PatientProfile
from accounts.serializers import (
    UserSerializer, PatientProfileSerializer, AllergySerializer,
    MedicalHistorySerializer, FamilyHistorySerializer, PrescriptionSerializer,
    LabResultSerializer, VitalSignsSerializer, MedicalDocumentSerializer
)

print("\n" + "="*70)
print("TESTING PATIENT DETAIL ENDPOINT LOGIC")
print("="*70)

try:
    patient = User.objects.get(id=6, role="patient")
    print(f"\n✓ Patient found: {patient.email}")
    
    # Get patient profile
    patient_profile = patient.patient_profile
    print(f"✓ Patient profile found")
    
    # Serialize patient data
    print(f"\n[1] Serializing patient...")
    patient_data = UserSerializer(patient).data
    print(f"✓ Patient serialized")
    
    # Serialize profile
    print(f"\n[2] Serializing profile...")
    profile_data = PatientProfileSerializer(patient_profile).data
    print(f"✓ Profile serialized")
    
    # Serialize allergies
    print(f"\n[3] Serializing allergies...")
    allergies_data = AllergySerializer(patient.allergies.all(), many=True).data
    print(f"✓ Allergies serialized: {len(allergies_data)} items")
    
    # Serialize medical history
    print(f"\n[4] Serializing medical history...")
    try:
        medical_history_data = MedicalHistorySerializer(patient.medical_history).data
        print(f"✓ Medical history serialized")
    except Exception as e:
        print(f"✗ Medical history error: {e}")
        medical_history_data = None
    
    # Serialize family history
    print(f"\n[5] Serializing family history...")
    family_history_data = FamilyHistorySerializer(patient.family_history.all(), many=True).data
    print(f"✓ Family history serialized: {len(family_history_data)} items")
    
    # Serialize prescriptions
    print(f"\n[6] Serializing prescriptions...")
    prescriptions_data = PrescriptionSerializer(patient.prescriptions.all(), many=True).data
    print(f"✓ Prescriptions serialized: {len(prescriptions_data)} items")
    
    # Serialize lab results
    print(f"\n[7] Serializing lab results...")
    lab_results_data = LabResultSerializer(patient.lab_results.all(), many=True).data
    print(f"✓ Lab results serialized: {len(lab_results_data)} items")
    
    # Serialize vital signs
    print(f"\n[8] Serializing vital signs...")
    vital_signs_data = VitalSignsSerializer(patient.vital_signs.all(), many=True).data
    print(f"✓ Vital signs serialized: {len(vital_signs_data)} items")
    
    # Serialize medical documents
    print(f"\n[9] Serializing medical documents...")
    documents_data = MedicalDocumentSerializer(patient.medical_documents.all(), many=True).data
    print(f"✓ Medical documents serialized: {len(documents_data)} items")
    
    print("\n" + "="*70)
    print("✓ ALL SERIALIZATIONS SUCCESSFUL")
    print("="*70 + "\n")
    
except Exception as e:
    print(f"\n✗ ERROR: {e}")
    import traceback
    traceback.print_exc()
