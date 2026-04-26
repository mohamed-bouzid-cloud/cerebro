from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    """Custom manager that uses email as the unique identifier."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "doctor")
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    ROLE_CHOICES = (
        ("doctor", "Doctor"),
        ("patient", "Patient"),
    )

    username = None  # remove default username field
    email = models.EmailField("email address", unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    
    # FHIR Integration Fields
    fhir_resource_id = models.CharField(max_length=255, blank=True, null=True,
                                       help_text="FHIR Patient or Practitioner resource ID")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name", "role"]

    objects = UserManager()

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"


class DoctorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="doctor_profile")
    specialty = models.CharField(max_length=120, blank=True, default="")
    license_number = models.CharField(max_length=60, blank=True, default="")
    
    # FHIR Integration Fields
    fhir_resource_id = models.CharField(max_length=255, blank=True, null=True,
                                       help_text="FHIR Practitioner resource ID")

    def __str__(self):
        return f"Dr. {self.user.get_full_name()} — {self.specialty}"


class PatientProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="patient_profile")
    date_of_birth = models.DateField(null=True, blank=True)
    phone_number = models.CharField(max_length=20, blank=True, default="")
    doctors = models.ManyToManyField(User, related_name="patients", blank=True,
                                     limit_choices_to={"role": "doctor"})
    blood_type = models.CharField(max_length=5, blank=True, default="", choices=(
        ("A+", "A+"), ("A-", "A-"), ("B+", "B+"), ("B-", "B-"),
        ("AB+", "AB+"), ("AB-", "AB-"), ("O+", "O+"), ("O-", "O-")
    ))
    
    # FHIR Integration Fields
    fhir_resource_id = models.CharField(max_length=255, blank=True, null=True,
                                       help_text="FHIR Patient resource ID")

    def __str__(self):
        return f"Patient: {self.user.get_full_name()}"


# ────────────────────────────────────────────
#  Medical Records & Appointments
# ────────────────────────────────────────────

class Allergy(models.Model):
    SEVERITY_CHOICES = (
        ("mild", "Mild"),
        ("moderate", "Moderate"),
        ("severe", "Severe"),
    )
    
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="allergies",
                                limit_choices_to={"role": "patient"})
    allergen = models.CharField(max_length=200)
    reaction = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    date_identified = models.DateField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Allergies"

    def __str__(self):
        return f"{self.patient.get_full_name()} — {self.allergen}"


class MedicalHistory(models.Model):
    patient = models.OneToOneField(User, on_delete=models.CASCADE, related_name="medical_history",
                                   limit_choices_to={"role": "patient"})
    chronic_conditions = models.TextField(blank=True, help_text="List of chronic conditions")
    surgeries = models.TextField(blank=True, help_text="Previous surgeries")
    medications = models.TextField(blank=True, help_text="Current medications")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Medical Histories"

    def __str__(self):
        return f"Medical history — {self.patient.get_full_name()}"


class FamilyHistory(models.Model):
    patient = models.OneToOneField(User, on_delete=models.CASCADE, related_name="family_history",
                                   limit_choices_to={"role": "patient"})
    conditions = models.TextField(blank=True, help_text="Family medical conditions")
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Family Histories"

    def __str__(self):
        return f"Family history — {self.patient.get_full_name()}"


class Insurance(models.Model):
    patient = models.OneToOneField(User, on_delete=models.CASCADE, related_name="insurance",
                                   limit_choices_to={"role": "patient"})
    provider = models.CharField(max_length=255)
    policy_number = models.CharField(max_length=100)
    group_number = models.CharField(max_length=100, blank=True)
    effective_date = models.DateField()
    expiry_date = models.DateField()

    def __str__(self):
        return f"Insurance — {self.patient.get_full_name()}"


class AdvanceDirective(models.Model):
    patient = models.OneToOneField(User, on_delete=models.CASCADE, related_name="advance_directive",
                                   limit_choices_to={"role": "patient"})
    document_url = models.URLField(blank=True)
    healthcare_proxy = models.CharField(max_length=255, blank=True)
    proxy_contact = models.CharField(max_length=20, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Advance directive — {self.patient.get_full_name()}"


class Appointment(models.Model):
    # FHIR-compliant status: proposed for consultation requests, booked for confirmed appointments
    STATUS_CHOICES = (
        ("proposed", "Proposed (Consultation Request)"),      # Patient requests consultation
        ("requested", "Requested (Pending Doctor Review)"),   # Awaiting doctor confirmation
        ("booked", "Booked (Confirmed)"),                      # Confirmed appointment
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    )
    
    CONSULTATION_TYPE_CHOICES = (
        ("video", "Video Call"),
        ("audio", "Audio Call"),
        ("in-person", "In-Person"),
        ("follow-up", "Follow-up"),
        ("general", "General"),
    )
    
    SYNC_STATUS_CHOICES = (
        ("pending", "Pending FHIR Sync"),
        ("synced", "Synced to FHIR"),
        ("failed", "FHIR Sync Failed"),
    )
    
    # Core appointment fields
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="appointments_as_patient",
                                limit_choices_to={"role": "patient"})
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name="appointments_as_doctor",
                               limit_choices_to={"role": "doctor"}, null=True, blank=True)  # Can be NULL for open consultation requests
    scheduled_at = models.DateTimeField(null=True, blank=True)  # Can be NULL for pending consultations
    duration_minutes = models.IntegerField(default=30)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="proposed")
    notes = models.TextField(blank=True)
    
    # Consultation-specific fields (used when status="proposed" or "requested")
    consultation_type = models.CharField(max_length=20, choices=CONSULTATION_TYPE_CHOICES, 
                                        default="general", blank=True)
    reason = models.TextField(blank=True, help_text="Reason for consultation request")
    meeting_link = models.URLField(blank=True, help_text="Meeting URL for virtual consultations")
    
    # FHIR Integration Fields
    fhir_resource_id = models.CharField(max_length=255, blank=True, null=True, 
                                       help_text="FHIR Appointment resource ID from FHIR server")
    fhir_sync_status = models.CharField(max_length=20, choices=SYNC_STATUS_CHOICES, 
                                       default="pending", help_text="Status of sync to FHIR server")
    fhir_sync_error = models.TextField(blank=True, help_text="Error message if FHIR sync failed")
    fhir_last_synced = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        status_label = "Consultation Request" if self.status in ["proposed", "requested"] else "Appointment"
        return f"{status_label}: {self.patient.get_full_name()} with Dr. {self.doctor.get_full_name()}"


class Encounter(models.Model):
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name="encounter",
                                       null=True, blank=True)
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="encounters",
                                limit_choices_to={"role": "patient"})
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name="conducted_encounters",
                               limit_choices_to={"role": "doctor"})
    encounter_date = models.DateTimeField(auto_now_add=True)
    chief_complaint = models.TextField()
    diagnosis = models.TextField(blank=True)
    treatment_plan = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-encounter_date"]

    def __str__(self):
        return f"Encounter: {self.patient.get_full_name()} — {self.encounter_date.date()}"


# ────────────────────────────────────────────
#  Messaging & Communication
# ────────────────────────────────────────────

class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages")
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_messages")
    subject = models.CharField(max_length=255)
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    attachment_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Message: {self.sender.email} → {self.recipient.email}"


# ────────────────────────────────────────────
#  Prescriptions (FHIR MedicationRequest)
# ────────────────────────────────────────────

class Prescription(models.Model):
    STATUS_CHOICES = (
        ("draft", "Draft"),
        ("active", "Active"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    )
    
    FREQUENCY_CHOICES = (
        ("once-daily", "Once Daily"),
        ("twice-daily", "Twice Daily"),
        ("three-times-daily", "Three Times Daily"),
        ("four-times-daily", "Four Times Daily"),
        ("as-needed", "As Needed"),
    )
    
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="prescriptions",
                                limit_choices_to={"role": "patient"})
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name="prescribed_medications",
                               limit_choices_to={"role": "doctor"})
    medication_name = models.CharField(max_length=255)
    dosage = models.CharField(max_length=100)  # e.g., "500mg"
    route = models.CharField(max_length=100, default="oral")  # oral, intravenous, etc.
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    duration_days = models.IntegerField(help_text="Number of days to take medication")
    quantity = models.IntegerField()  # Number of tablets/units
    refills_remaining = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    notes = models.TextField(blank=True)
    prescribed_at = models.DateTimeField(auto_now_add=True)
    start_date = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["-prescribed_at"]

    def __str__(self):
        return f"{self.medication_name} ({self.dosage}) - {self.patient.get_full_name()}"


# ────────────────────────────────────────────
#  Lab Results (FHIR DiagnosticReport)
# ────────────────────────────────────────────

class LabResult(models.Model):
    TEST_STATUS_CHOICES = (
        ("pending", "Pending"),
        ("completed", "Completed"),
        ("abnormal", "Abnormal"),
        ("reviewed", "Reviewed"),
    )
    
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="lab_results",
                                limit_choices_to={"role": "patient"})
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name="ordered_lab_tests",
                               limit_choices_to={"role": "doctor"})
    test_name = models.CharField(max_length=255)  # e.g., "Blood Glucose", "Complete Blood Count"
    test_code = models.CharField(max_length=100, blank=True)  # LOINC code
    status = models.CharField(max_length=20, choices=TEST_STATUS_CHOICES, default="pending")
    result_value = models.CharField(max_length=255, blank=True)
    result_unit = models.CharField(max_length=50, blank=True)  # e.g., "mg/dL", "g/dL"
    reference_range = models.CharField(max_length=150, blank=True)
    is_abnormal = models.BooleanField(default=False)
    interpretation = models.CharField(max_length=255, blank=True)  # "High", "Low", "Normal"
    notes = models.TextField(blank=True)
    ordered_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    result_file_url = models.URLField(blank=True)  # PDF or scanned result

    class Meta:
        ordering = ["-ordered_at"]

    def __str__(self):
        return f"{self.test_name} - {self.patient.get_full_name()}"


# ────────────────────────────────────────────
#  Vital Signs (FHIR Observation)
# ────────────────────────────────────────────

class VitalSigns(models.Model):
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="vital_signs",
                                limit_choices_to={"role": "patient"})
    
    # Vital measurements
    temperature = models.FloatField(null=True, blank=True, help_text="°C")
    heart_rate = models.IntegerField(null=True, blank=True, help_text="bpm")
    blood_pressure_systolic = models.IntegerField(null=True, blank=True, help_text="mmHg")
    blood_pressure_diastolic = models.IntegerField(null=True, blank=True, help_text="mmHg")
    respiratory_rate = models.IntegerField(null=True, blank=True, help_text="breaths/min")
    oxygen_saturation = models.FloatField(null=True, blank=True, help_text="% SpO2")
    weight = models.FloatField(null=True, blank=True, help_text="kg")
    height = models.FloatField(null=True, blank=True, help_text="cm")
    
    measured_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-measured_at"]
        verbose_name_plural = "Vital Signs"

    def __str__(self):
        return f"Vitals for {self.patient.get_full_name()} - {self.measured_at.date()}"


# ────────────────────────────────────────────
#  Medical Documents (FHIR DocumentReference)
# ────────────────────────────────────────────

class MedicalDocument(models.Model):
    DOC_TYPE_CHOICES = (
        ("lab-result", "Lab Result"),
        ("imaging", "Imaging Report"),
        ("discharge-summary", "Discharge Summary"),
        ("prescription", "Prescription"),
        ("consultation-note", "Consultation Note"),
        ("progress-note", "Progress Note"),
        ("vaccination-record", "Vaccination Record"),
        ("other", "Other"),
    )
    
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="medical_documents",
                                limit_choices_to={"role": "patient"})
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name="created_documents",
                               limit_choices_to={"role": "doctor"}, null=True, blank=True)
    
    document_type = models.CharField(max_length=50, choices=DOC_TYPE_CHOICES)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    file_url = models.URLField()
    file_format = models.CharField(max_length=20, default="pdf")  # pdf, docx, jpg, etc.
    file_size = models.BigIntegerField(null=True, blank=True)  # in bytes
    
    is_shared = models.BooleanField(default=True)  # Visible to patient
    shared_with_doctors = models.ManyToManyField(User, related_name="shared_documents", blank=True,
                                                 limit_choices_to={"role": "doctor"})
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} - {self.patient.get_full_name()}"


# ────────────────────────────────────────────
#  Referrals (FHIR ServiceRequest)
# ────────────────────────────────────────────

class Referral(models.Model):
    STATUS_CHOICES = (
        ("requested", "Requested"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    )
    
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="referrals_received",
                                limit_choices_to={"role": "patient"})
    from_doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name="referrals_sent",
                                   limit_choices_to={"role": "doctor"})
    to_doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name="referrals_to_me",
                                 limit_choices_to={"role": "doctor"}, null=True, blank=True)
    
    specialty_requested = models.CharField(max_length=255)  # e.g., "Cardiology", "Neurology"
    reason = models.TextField()
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="requested")
    
    is_urgent = models.BooleanField(default=False)
    requested_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-requested_at"]

    def __str__(self):
        return f"Referral: {self.patient.get_full_name()} to {self.specialty_requested}"


# ────────────────────────────────────────────
#  Medical Imaging (DICOM)
# ────────────────────────────────────────────

class DICOMStudy(models.Model):
    """Store DICOM imaging studies (CT, MRI, X-Ray, etc)."""
    MODALITY_CHOICES = (
        ("CT", "Computed Tomography"),
        ("MR", "Magnetic Resonance"),
        ("XC", "X-Ray"),
        ("US", "Ultrasound"),
        ("PET", "Positron Emission Tomography"),
        ("NM", "Nuclear Medicine"),
        ("OT", "Other"),
    )
    
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="dicom_studies",
                                limit_choices_to={"role": "patient"})
    ordering_doctor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="ordered_dicom_studies",
                                        limit_choices_to={"role": "doctor"})
    
    study_id = models.CharField(max_length=100, unique=True)  # DICOM Study UID
    accession_number = models.CharField(max_length=50, blank=True)
    modality = models.CharField(max_length=10, choices=MODALITY_CHOICES)
    body_part = models.CharField(max_length=100, blank=True)  # e.g., "Chest", "Brain", "Abdomen"
    study_date = models.DateField()
    study_time = models.TimeField(null=True, blank=True)
    
    # Study metadata
    institution_name = models.CharField(max_length=255, blank=True)
    referring_physician = models.CharField(max_length=255, blank=True)
    performing_physician = models.CharField(max_length=255, blank=True)
    
    # File handling
    file_path = models.FileField(upload_to='dicom_studies/%Y/%m/', null=True, blank=True)
    local_folder_path = models.CharField(max_length=500, blank=True, help_text="Local pathway to DICOM folder on the doctor's machine")
    file_size_mb = models.FloatField(default=0)  # Size in MB
    number_of_images = models.IntegerField(default=1)
    
    # Status
    STATUS_CHOICES = (
        ("uploaded", "Uploaded"),
        ("processing", "Processing"),
        ("completed", "Completed"),
        ("archived", "Archived"),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="uploaded")
    
    # Reporting
    is_reviewed = models.BooleanField(default=False)
    review_date = models.DateTimeField(null=True, blank=True)
    findings = models.TextField(blank=True)
    impression = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["-study_date"]
    
    def __str__(self):
        return f"{self.get_modality_display()} - {self.patient.get_full_name()} ({self.study_date})"


class DICOMSeries(models.Model):
    """Store individual DICOM series within a study."""
    study = models.ForeignKey(DICOMStudy, on_delete=models.CASCADE, related_name="series")
    
    series_id = models.CharField(max_length=100)  # DICOM Series UID
    series_number = models.IntegerField()
    series_description = models.CharField(max_length=255, blank=True)
    number_of_instances = models.IntegerField(default=1)
    
    # Technical details
    rows = models.IntegerField(null=True, blank=True)
    columns = models.IntegerField(null=True, blank=True)
    bits_allocated = models.IntegerField(null=True, blank=True)
    bits_stored = models.IntegerField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["series_number"]
    
    def __str__(self):
        return f"Series {self.series_number}: {self.series_description}"


# ────────────────────────────────────────────
#  HL7v2 Messages
# ────────────────────────────────────────────

class HL7Message(models.Model):
    """Store HL7v2 messages for healthcare system integration."""
    MESSAGE_TYPE_CHOICES = (
        ("ADT", "Admit, Discharge, Transfer"),
        ("ORM", "Order Message"),
        ("ORU", "Observation Result"),
        ("RGV", "Pharmacy/Give"),
        ("MDM", "Medical Document Management"),
        ("LAB", "Laboratory"),
        ("SCH", "Scheduling"),
    )
    
    MESSAGE_STATUS_CHOICES = (
        ("received", "Received"),
        ("processing", "Processing"),
        ("processed", "Processed"),
        ("error", "Error"),
        ("archived", "Archived"),
    )
    
    # Message identification
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPE_CHOICES)
    message_control_id = models.CharField(max_length=100, unique=True)
    message_version = models.CharField(max_length=10, default="2.5")  # e.g., "2.3", "2.5"
    
    # Message content
    raw_message = models.TextField()  # Full HL7 message
    message_status = models.CharField(max_length=20, choices=MESSAGE_STATUS_CHOICES, default="received")
    
    # Related records
    patient = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                related_name="hl7_messages", limit_choices_to={"role": "patient"})
    doctor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                               related_name="sent_hl7_messages", limit_choices_to={"role": "doctor"})
    
    # Source/Destination
    sending_application = models.CharField(max_length=255, blank=True)
    sending_facility = models.CharField(max_length=255, blank=True)
    receiving_application = models.CharField(max_length=255, blank=True)
    receiving_facility = models.CharField(max_length=255, blank=True)
    
    # Timestamps
    message_datetime = models.DateTimeField()
    received_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    # Error handling
    error_message = models.TextField(blank=True)
    error_details = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ["-received_at"]
        indexes = [
            models.Index(fields=['message_type', 'message_status']),
            models.Index(fields=['patient', 'received_at']),
        ]
    
    def __str__(self):
        return f"{self.get_message_type_display()} - {self.message_control_id}"


# ────────────────────────────────────────────
#  FHIR Resources (for external server sync)
# ────────────────────────────────────────────

class FHIRResourceLog(models.Model):
    """Log of FHIR resource exports and syncs."""
    RESOURCE_TYPE_CHOICES = (
        ("Patient", "Patient"),
        ("Practitioner", "Practitioner"),
        ("Appointment", "Appointment"),
        ("Observation", "Observation"),
        ("DiagnosticReport", "DiagnosticReport"),
        ("Medication", "Medication"),
        ("MedicationRequest", "MedicationRequest"),
        ("ServiceRequest", "ServiceRequest"),
        ("DocumentReference", "DocumentReference"),
    )
    
    SYNC_STATUS_CHOICES = (
        ("pending", "Pending"),
        ("syncing", "Syncing"),
        ("synced", "Synced"),
        ("failed", "Failed"),
    )
    
    resource_type = models.CharField(max_length=50, choices=RESOURCE_TYPE_CHOICES)
    local_object_id = models.CharField(max_length=100)  # e.g., patient.id
    fhir_resource_id = models.CharField(max_length=100, blank=True)  # FHIR server resource ID
    
    # Server information
    fhir_server_url = models.URLField()
    
    # Content
    fhir_payload = models.JSONField()  # FHIR JSON representation
    
    # Status
    sync_status = models.CharField(max_length=20, choices=SYNC_STATUS_CHOICES, default="pending")
    sync_timestamp = models.DateTimeField(null=True, blank=True)
    
    # Error handling
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["-created_at"]
        verbose_name = "FHIR Resource Log"
        verbose_name_plural = "FHIR Resource Logs"
    
    def __str__(self):
        return f"{self.resource_type} - {self.local_object_id} ({self.sync_status})"

# ────────────────────────────────────────────
#  Notifications
# ────────────────────────────────────────────

class Notification(models.Model):
    NOTIFICATION_TYPE_CHOICES = (
        ("appointment", "Appointment Reminder"),
        ("result", "New Lab/Imaging Result"),
        ("prescription", "New Prescription"),
        ("message", "New Message"),
        ("system", "System Alert"),
    )

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=255)
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPE_CHOICES, default="system")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} for {self.recipient.email}"


# ────────────────────────────────────────────
#  Triage Score & Clinical Assessment
# ────────────────────────────────────────────

class TriageScore(models.Model):
    """Triage score for patient urgency assessment with component breakdown."""
    URGENCY_LEVEL_CHOICES = (
        ("resuscitation", "Resuscitation (Level 1)"),
        ("emergency", "Emergency (Level 2)"),
        ("urgent", "Urgent (Level 3)"),
        ("semi-urgent", "Semi-Urgent (Level 4)"),
        ("non-urgent", "Non-Urgent (Level 5)"),
    )
    
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="triage_scores",
                                limit_choices_to={"role": "patient"})
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name="assigned_triage_scores",
                               limit_choices_to={"role": "doctor"})
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name="triage_scores",
                                   null=True, blank=True)
    
    # Overall triage score (1-5)
    urgency_level = models.CharField(max_length=20, choices=URGENCY_LEVEL_CHOICES)
    overall_score = models.IntegerField(help_text="Overall score 1-100")
    
    # Component scores (breakdown)
    chief_complaint_severity = models.IntegerField(default=0, help_text="0-10 scale")
    vital_signs_severity = models.IntegerField(default=0, help_text="0-10 scale")
    mental_status_severity = models.IntegerField(default=0, help_text="0-10 scale")
    pain_level = models.IntegerField(default=0, help_text="0-10 visual pain scale")
    
    # Assessment details
    chief_complaint = models.CharField(max_length=255, blank=True)
    assessment_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Triage Scores"
    
    def __str__(self):
        return f"Triage: {self.patient.get_full_name()} - {self.get_urgency_level_display()}"


# ────────────────────────────────────────────
#  Consultation Notes & Clinical Documentation
# ────────────────────────────────────────────

class ConsultationNote(models.Model):
    """Clinical notes written during or after a consultation/encounter."""
    NOTE_TYPE_CHOICES = (
        ("chief-complaint", "Chief Complaint"),
        ("history-present-illness", "History of Present Illness"),
        ("physical-exam", "Physical Examination"),
        ("assessment-plan", "Assessment & Plan"),
        ("progress-note", "Progress Note"),
        ("follow-up-note", "Follow-up Note"),
    )
    
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name="consultation_notes")
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="consultation_notes_received",
                                limit_choices_to={"role": "patient"})
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name="consultation_notes_written",
                               limit_choices_to={"role": "doctor"})
    
    note_type = models.CharField(max_length=30, choices=NOTE_TYPE_CHOICES, default="progress-note")
    content = models.TextField()
    
    # Vital signs at time of note
    vital_signs = models.JSONField(default=dict, blank=True,
                                   help_text="Store vital signs snapshot: temp, HR, BP, RR, SpO2, weight")
    
    # Medical information
    medications_reviewed = models.TextField(blank=True, help_text="Current medications discussed")
    allergies_reviewed = models.TextField(blank=True, help_text="Allergies reviewed with patient")
    
    is_final = models.BooleanField(default=True, help_text="True if this is final documentation")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by_full_name = models.CharField(max_length=255, blank=True)  # Snapshot for audit
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.get_note_type_display()} - {self.patient.get_full_name()}"


# ────────────────────────────────────────────
#  Patient Event Timeline
# ────────────────────────────────────────────

class PatientEventTimeline(models.Model):
    """Chronological log of patient events for timeline view (appointments, notes, results, etc)."""
    EVENT_TYPE_CHOICES = (
        ("appointment", "Appointment"),
        ("lab-result", "Lab Result"),
        ("imaging-study", "Imaging Study"),
        ("prescription", "Prescription"),
        ("consultation-note", "Consultation Note"),
        ("referral", "Referral"),
        ("vital-signs", "Vital Signs"),
        ("admission", "Hospital Admission"),
        ("discharge", "Hospital Discharge"),
        ("allergy-reported", "Allergy Reported"),
        ("medication-change", "Medication Change"),
        ("other", "Other Event"),
    )
    
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="event_timeline",
                                limit_choices_to={"role": "patient"})
    
    event_type = models.CharField(max_length=30, choices=EVENT_TYPE_CHOICES)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Link to related objects
    appointment = models.ForeignKey(Appointment, on_delete=models.SET_NULL, null=True, blank=True)
    lab_result = models.ForeignKey(LabResult, on_delete=models.SET_NULL, null=True, blank=True)
    dicom_study = models.ForeignKey(DICOMStudy, on_delete=models.SET_NULL, null=True, blank=True)
    prescription = models.ForeignKey(Prescription, on_delete=models.SET_NULL, null=True, blank=True)
    consultation_note = models.ForeignKey(ConsultationNote, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Event timestamp (may differ from created_at for historical events)
    event_date = models.DateTimeField()
    
    # Severity/urgency indicator
    is_critical = models.BooleanField(default=False, help_text="Highlight as critical event")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["-event_date"]
        verbose_name_plural = "Patient Event Timelines"
        indexes = [
            models.Index(fields=['patient', 'event_date']),
            models.Index(fields=['event_type']),
        ]
    
    def __str__(self):
        return f"{self.patient.get_full_name()} - {self.title} ({self.event_date.date()})"
