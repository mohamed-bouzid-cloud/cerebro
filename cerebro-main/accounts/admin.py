from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, DoctorProfile, PatientProfile, Allergy, MedicalHistory,
    FamilyHistory, Insurance, AdvanceDirective, Appointment, Encounter,
<<<<<<< HEAD
    Message, Consultation, Prescription, LabResult, VitalSigns, MedicalDocument, Referral,
=======
    Message, Prescription, LabResult, VitalSigns, MedicalDocument, Referral,
>>>>>>> b381c81bab0b6500d6e25aa0d8e664d8397d0550
    DICOMStudy, DICOMSeries, HL7Message, FHIRResourceLog
)


class DoctorProfileInline(admin.StackedInline):
    model = DoctorProfile
    can_delete = False
    verbose_name_plural = "Doctor Profile"


class PatientProfileInline(admin.StackedInline):
    model = PatientProfile
    can_delete = False
    verbose_name_plural = "Patient Profile"


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "first_name", "last_name", "role", "is_active")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name")}),
        ("Permissions", {"fields": ("role", "is_active", "is_staff", "is_superuser")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "password1", "password2", "first_name", "last_name", "role"),
        }),
    )
    list_filter = ("role", "is_active", "is_staff")
    search_fields = ("email", "first_name", "last_name")
    ordering = ("email",)

    def get_inlines(self, request, obj=None):
        if obj is None:
            return []
        if obj.role == "doctor":
            return [DoctorProfileInline]
        if obj.role == "patient":
            return [PatientProfileInline]
        return []


@admin.register(Allergy)
class AllergyAdmin(admin.ModelAdmin):
    list_display = ("allergen", "patient", "severity")
    list_filter = ("severity",)
    search_fields = ("allergen", "patient__email")


@admin.register(MedicalHistory)
class MedicalHistoryAdmin(admin.ModelAdmin):
    list_display = ("patient", "updated_at")
    search_fields = ("patient__email",)


@admin.register(FamilyHistory)
class FamilyHistoryAdmin(admin.ModelAdmin):
    list_display = ("patient",)
    search_fields = ("patient__email",)


@admin.register(Insurance)
class InsuranceAdmin(admin.ModelAdmin):
    list_display = ("patient", "provider", "policy_number")
    search_fields = ("patient__email", "provider")


@admin.register(AdvanceDirective)
class AdvanceDirectiveAdmin(admin.ModelAdmin):
    list_display = ("patient", "healthcare_proxy", "created_at")
    search_fields = ("patient__email",)


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ("patient", "doctor", "scheduled_at", "status")
    list_filter = ("status", "scheduled_at")
    search_fields = ("patient__email", "doctor__email")
    ordering = ("-scheduled_at",)


@admin.register(Encounter)
class EncounterAdmin(admin.ModelAdmin):
    list_display = ("patient", "doctor", "encounter_date")
    search_fields = ("patient__email", "doctor__email")
    ordering = ("-encounter_date",)


@admin.register(DoctorProfile)
class DoctorProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "specialty", "license_number")


@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "date_of_birth", "phone_number")


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("sender", "recipient", "is_read", "created_at")
    list_filter = ("is_read", "created_at")
    search_fields = ("sender__email", "recipient__email", "subject")
    ordering = ("-created_at",)


<<<<<<< HEAD
@admin.register(Consultation)
class ConsultationAdmin(admin.ModelAdmin):
    list_display = ("patient", "doctor", "consultation_type", "status", "scheduled_at")
    list_filter = ("status", "consultation_type", "scheduled_at")
    search_fields = ("patient__email", "doctor__email")
    ordering = ("-created_at",)


=======
>>>>>>> b381c81bab0b6500d6e25aa0d8e664d8397d0550
@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ("medication_name", "patient", "doctor", "status", "prescribed_at")
    list_filter = ("status", "frequency", "prescribed_at")
    search_fields = ("medication_name", "patient__email", "doctor__email")
    ordering = ("-prescribed_at",)


@admin.register(LabResult)
class LabResultAdmin(admin.ModelAdmin):
    list_display = ("test_name", "patient", "status", "is_abnormal", "completed_at")
    list_filter = ("status", "is_abnormal", "ordered_at")
    search_fields = ("test_name", "patient__email", "doctor__email")
    ordering = ("-ordered_at",)


@admin.register(VitalSigns)
class VitalSignsAdmin(admin.ModelAdmin):
    list_display = ("patient", "temperature", "heart_rate", "measured_at")
    search_fields = ("patient__email",)
    ordering = ("-measured_at",)


@admin.register(MedicalDocument)
class MedicalDocumentAdmin(admin.ModelAdmin):
    list_display = ("title", "patient", "document_type", "is_shared", "created_at")
    list_filter = ("document_type", "is_shared", "created_at")
    search_fields = ("title", "patient__email")
    filter_horizontal = ("shared_with_doctors",)
    ordering = ("-created_at",)


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = ("patient", "from_doctor", "to_doctor", "specialty_requested", "status", "is_urgent")
    list_filter = ("status", "is_urgent", "specialty_requested", "requested_at")
    search_fields = ("patient__email", "from_doctor__email", "to_doctor__email", "specialty_requested")
    ordering = ("-requested_at",)


# ────────────────────────────────────────────
#  DICOM Imaging Admin
# ────────────────────────────────────────────

class DICOMSeriesInline(admin.TabularInline):
    model = DICOMSeries
    extra = 0
    readonly_fields = ("created_at",)
    fields = ("series_id", "series_number", "series_description", "number_of_instances", "created_at")


@admin.register(DICOMStudy)
class DICOMStudyAdmin(admin.ModelAdmin):
    list_display = ("study_id", "patient", "modality", "body_part", "study_date", "status", "is_reviewed")
    list_filter = ("status", "modality", "study_date", "is_reviewed")
    search_fields = ("study_id", "patient__email", "accession_number")
    readonly_fields = ("study_id", "created_at", "updated_at")
    inlines = [DICOMSeriesInline]
    fieldsets = (
        ("Study Information", {
            "fields": ("study_id", "accession_number", "modality", "body_part", "study_date", "study_time")
        }),
        ("Patient & Physician", {
            "fields": ("patient", "ordering_doctor", "referring_physician", "performing_physician")
        }),
        ("File Information", {
            "fields": ("file_path", "file_size_mb", "number_of_images")
        }),
        ("Review", {
            "fields": ("status", "is_reviewed", "review_date", "findings", "impression")
        }),
        ("Metadata", {
            "fields": ("institution_name", "created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )
    ordering = ("-study_date",)


@admin.register(DICOMSeries)
class DICOMSeriesAdmin(admin.ModelAdmin):
    list_display = ("series_id", "study", "series_number", "series_description", "number_of_instances")
    list_filter = ("study__study_date", "created_at")
    search_fields = ("series_id", "series_description", "study__study_id")
    readonly_fields = ("created_at",)
    ordering = ("study", "series_number")


# ────────────────────────────────────────────
#  HL7 Messages Admin
# ────────────────────────────────────────────

@admin.register(HL7Message)
class HL7MessageAdmin(admin.ModelAdmin):
    list_display = ("message_control_id", "message_type", "patient", "message_status", "received_at")
    list_filter = ("message_type", "message_status", "received_at")
    search_fields = ("message_control_id", "patient__email", "sending_application")
    readonly_fields = ("message_control_id", "received_at", "raw_message")
    fieldsets = (
        ("Message Info", {
            "fields": ("message_control_id", "message_type", "message_version", "message_status")
        }),
        ("Content", {
            "fields": ("raw_message",),
            "classes": ("collapse",)
        }),
        ("Routing", {
            "fields": ("patient", "doctor", "sending_application", "sending_facility", 
                      "receiving_application", "receiving_facility")
        }),
        ("Timestamps", {
            "fields": ("message_datetime", "received_at", "processed_at"),
            "classes": ("collapse",)
        }),
        ("Error Handling", {
            "fields": ("error_message", "error_details"),
            "classes": ("collapse",)
        }),
    )
    ordering = ("-received_at",)


# ────────────────────────────────────────────
#  FHIR Resource Log Admin
# ────────────────────────────────────────────

@admin.register(FHIRResourceLog)
class FHIRResourceLogAdmin(admin.ModelAdmin):
    list_display = ("resource_type", "local_object_id", "fhir_resource_id", "sync_status", "sync_timestamp")
    list_filter = ("resource_type", "sync_status", "created_at")
    search_fields = ("local_object_id", "fhir_resource_id", "fhir_server_url")
    readonly_fields = ("created_at", "updated_at", "fhir_payload")
    fieldsets = (
        ("Resource Info", {
            "fields": ("resource_type", "local_object_id", "fhir_resource_id")
        }),
        ("Server Information", {
            "fields": ("fhir_server_url", "sync_status", "sync_timestamp")
        }),
        ("Payload", {
            "fields": ("fhir_payload",),
            "classes": ("collapse",)
        }),
        ("Error Handling", {
            "fields": ("error_message",),
            "classes": ("collapse",)
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )
    ordering = ("-created_at",)
