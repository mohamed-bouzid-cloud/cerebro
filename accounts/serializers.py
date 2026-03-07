from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import (
    User, DoctorProfile, PatientProfile,
    Allergy, MedicalHistory, FamilyHistory, Insurance, AdvanceDirective,
    Appointment, Encounter, Message, Consultation, Prescription, LabResult,
    VitalSigns, MedicalDocument, Referral, DICOMStudy, DICOMSeries, HL7Message, FHIRResourceLog
)


# ────────────────────────────────────────────
#  Medical Records
# ────────────────────────────────────────────

class AllergySerializer(serializers.ModelSerializer):
    class Meta:
        model = Allergy
        fields = ("id", "allergen", "reaction", "severity", "date_identified")


class MedicalHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalHistory
        fields = ("chronic_conditions", "surgeries", "medications", "updated_at")


class FamilyHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FamilyHistory
        fields = ("conditions", "notes")


class InsuranceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Insurance
        fields = ("id", "provider", "policy_number", "group_number", "effective_date", "expiry_date")


class AdvanceDirectiveSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdvanceDirective
        fields = ("id", "document_url", "healthcare_proxy", "proxy_contact", "notes", "created_at", "updated_at")


class EncounterSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source="doctor.get_full_name", read_only=True)
    
    class Meta:
        model = Encounter
        fields = ("id", "doctor", "doctor_name", "encounter_date", "chief_complaint", "diagnosis", "treatment_plan", "notes")


# ────────────────────────────────────────────
#  Appointments
# ────────────────────────────────────────────

class AppointmentSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source="doctor.get_full_name", read_only=True)
    doctor_specialty = serializers.CharField(source="doctor.doctor_profile.specialty", read_only=True)
    patient_name = serializers.CharField(source="patient.get_full_name", read_only=True)
    patient = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = Appointment
        fields = ("id", "patient", "patient_name", "doctor", "doctor_name", "doctor_specialty", 
                  "scheduled_at", "duration_minutes", "status", "notes", "created_at")


# ────────────────────────────────────────────
#  Profile
# ────────────────────────────────────────────

class DoctorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorProfile
        fields = ("specialty", "license_number")


class PatientProfileSerializer(serializers.ModelSerializer):
    doctors_list = serializers.SerializerMethodField()
    
    class Meta:
        model = PatientProfile
        fields = ("date_of_birth", "phone_number", "doctors_list")
    
    def get_doctors_list(self, obj):
        try:
            doctors = obj.doctors.all()
            return [
                {
                    "id": doc.id,
                    "name": doc.get_full_name(),
                    "specialty": getattr(getattr(doc, "doctor_profile", None), "specialty", ""),
                }
                for doc in doctors
            ]
        except:
            return []


class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "role", "profile")

    def get_profile(self, obj):
        if obj.role == "doctor" and hasattr(obj, "doctor_profile"):
            return DoctorProfileSerializer(obj.doctor_profile).data
        if obj.role == "patient" and hasattr(obj, "patient_profile"):
            return PatientProfileSerializer(obj.patient_profile).data
        return {}


# ────────────────────────────────────────────
#  Registration
# ────────────────────────────────────────────

class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=30)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES)

    # Doctor-only optional fields
    specialty = serializers.CharField(max_length=120, required=False, default="")
    license_number = serializers.CharField(max_length=60, required=False, default="")

    # Patient-only optional fields
    date_of_birth = serializers.DateField(required=False, allow_null=True, default=None)
    phone_number = serializers.CharField(max_length=20, required=False, default="")

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        return data

    def create(self, validated_data):
        # Pop profile fields
        specialty = validated_data.pop("specialty", "")
        license_number = validated_data.pop("license_number", "")
        date_of_birth = validated_data.pop("date_of_birth", None)
        phone_number = validated_data.pop("phone_number", "")
        validated_data.pop("password2")

        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            role=validated_data["role"],
        )

        # Create the matching profile
        if user.role == "doctor":
            DoctorProfile.objects.create(
                user=user,
                specialty=specialty,
                license_number=license_number,
            )
        else:
            PatientProfile.objects.create(
                user=user,
                date_of_birth=date_of_birth,
                phone_number=phone_number,
            )

        return user


# ────────────────────────────────────────────
#  Login
# ────────────────────────────────────────────

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(email=data["email"].lower(), password=data["password"])
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account is deactivated.")
        data["user"] = user
        return data


# ────────────────────────────────────────────
#  Advanced Features Serializers
# ────────────────────────────────────────────

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.get_full_name", read_only=True)
    recipient_name = serializers.CharField(source="recipient.get_full_name", read_only=True)
    sender = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = Message
        fields = ("id", "sender", "sender_name", "recipient", "recipient_name", 
                  "subject", "content", "is_read", "attachment_url", "created_at", "updated_at")


class ConsultationSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.get_full_name", read_only=True)
    doctor_name = serializers.CharField(source="doctor.get_full_name", read_only=True)
    doctor_specialty = serializers.CharField(source="doctor.doctor_profile.specialty", read_only=True)
    patient = serializers.PrimaryKeyRelatedField(read_only=True)
    status = serializers.CharField(read_only=True)
    
    class Meta:
        model = Consultation
        fields = ("id", "patient", "patient_name", "doctor", "doctor_name", "doctor_specialty",
                  "consultation_type", "status", "reason", "scheduled_at", "duration_minutes",
                  "notes", "meeting_link", "created_at")


class PrescriptionSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.get_full_name", read_only=True)
    doctor_name = serializers.CharField(source="doctor.get_full_name", read_only=True)
    
    class Meta:
        model = Prescription
        fields = ("id", "patient", "patient_name", "doctor", "doctor_name", "medication_name",
                  "dosage", "route", "frequency", "duration_days", "quantity", "refills_remaining",
                  "status", "notes", "prescribed_at", "start_date", "expiry_date")


class LabResultSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.get_full_name", read_only=True)
    doctor_name = serializers.CharField(source="doctor.get_full_name", read_only=True)
    
    class Meta:
        model = LabResult
        fields = ("id", "patient", "patient_name", "doctor", "doctor_name", "test_name",
                  "test_code", "status", "result_value", "result_unit", "reference_range",
                  "is_abnormal", "interpretation", "notes", "ordered_at", "completed_at", "result_file_url")


class VitalSignsSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.get_full_name", read_only=True)
    
    class Meta:
        model = VitalSigns
        fields = ("id", "patient", "patient_name", "temperature", "heart_rate",
                  "blood_pressure_systolic", "blood_pressure_diastolic", "respiratory_rate",
                  "oxygen_saturation", "weight", "height", "measured_at", "notes")


class MedicalDocumentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.get_full_name", read_only=True)
    doctor_name = serializers.CharField(source="doctor.get_full_name", read_only=True, allow_null=True)
    
    class Meta:
        model = MedicalDocument
        fields = ("id", "patient", "patient_name", "doctor", "doctor_name", "document_type",
                  "title", "description", "file_url", "file_format", "file_size", "is_shared",
                  "created_at", "updated_at")


class ReferralSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.get_full_name", read_only=True)
    from_doctor_name = serializers.CharField(source="from_doctor.get_full_name", read_only=True)
    to_doctor_name = serializers.CharField(source="to_doctor.get_full_name", read_only=True, allow_null=True)
    
    class Meta:
        model = Referral
        fields = ("id", "patient", "patient_name", "from_doctor", "from_doctor_name",
                  "to_doctor", "to_doctor_name", "specialty_requested", "reason", "notes",
                  "status", "is_urgent", "requested_at", "accepted_at")


# ────────────────────────────────────────────
#  DICOM Imaging Serializers
# ────────────────────────────────────────────

class DICOMSeriesSerializer(serializers.ModelSerializer):
    class Meta:
        model = DICOMSeries
        fields = ("id", "series_id", "series_number", "series_description", "number_of_instances",
                  "rows", "columns", "bits_allocated", "bits_stored", "created_at")


class DICOMStudySerializer(serializers.ModelSerializer):
    ordering_doctor_name = serializers.CharField(source="ordering_doctor.get_full_name", read_only=True, allow_null=True)
    patient_name = serializers.CharField(source="patient.get_full_name", read_only=True)
    series = DICOMSeriesSerializer(many=True, read_only=True)
    
    class Meta:
        model = DICOMStudy
        fields = ("id", "study_id", "accession_number", "patient", "patient_name", "ordering_doctor",
                  "ordering_doctor_name", "modality", "body_part", "study_date", "study_time",
                  "file_size_mb", "number_of_images", "status", "is_reviewed", "review_date",
                  "findings", "impression", "series", "created_at", "updated_at")
        read_only_fields = ("created_at", "updated_at")


# ────────────────────────────────────────────
#  HL7 Message Serializers
# ────────────────────────────────────────────

class HL7MessageSerializer(serializers.ModelSerializer):
    patient_email = serializers.CharField(source="patient.email", read_only=True, allow_null=True)
    doctor_name = serializers.CharField(source="doctor.get_full_name", read_only=True, allow_null=True)
    
    class Meta:
        model = HL7Message
        fields = ("id", "message_control_id", "message_type", "message_version", "message_status",
                  "patient", "patient_email", "doctor", "doctor_name", "sending_application",
                  "sending_facility", "receiving_application", "receiving_facility",
                  "message_datetime", "received_at", "processed_at", "error_message", "raw_message")
        read_only_fields = ("received_at", "message_control_id")


# ────────────────────────────────────────────
#  FHIR Resource Log Serializers
# ────────────────────────────────────────────

class FHIRResourceLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = FHIRResourceLog
        fields = ("id", "resource_type", "local_object_id", "fhir_resource_id", "fhir_server_url",
                  "sync_status", "sync_timestamp", "error_message", "created_at", "updated_at")
        read_only_fields = ("created_at", "updated_at")
