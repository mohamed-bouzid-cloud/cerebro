from rest_framework import status, viewsets, filters
from rest_framework.decorators import action
from rest_framework.generics import GenericAPIView, RetrieveAPIView, ListCreateAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.db import models
from django.db.models import Q
from datetime import timedelta

import json

from .models import (
    User, DoctorProfile, PatientProfile,
    Allergy, MedicalHistory, FamilyHistory, Insurance, AdvanceDirective,
    Appointment, Encounter,
    Message, Prescription, LabResult, VitalSigns, MedicalDocument, Referral,
    DICOMStudy, DICOMSeries, HL7Message, FHIRResourceLog, Notification,
    TriageScore, ConsultationNote, PatientEventTimeline
)
from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer,
    AllergySerializer, MedicalHistorySerializer, FamilyHistorySerializer,
    InsuranceSerializer, AdvanceDirectiveSerializer,
    AppointmentSerializer, EncounterSerializer,
    MessageSerializer, PrescriptionSerializer, 
    LabResultSerializer, VitalSignsSerializer, MedicalDocumentSerializer, ReferralSerializer,
    DICOMStudySerializer, DICOMSeriesSerializer, HL7MessageSerializer, FHIRResourceLogSerializer, NotificationSerializer,
    TriageScoreSerializer, ConsultationNoteSerializer, PatientEventTimelineSerializer
)


def _get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


# ────────────────────────────────────────────
#  Auth Views
# ────────────────────────────────────────────

class RegisterView(GenericAPIView):
    """POST /api/auth/register/  — create a new doctor or patient account."""

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": _get_tokens(user),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(GenericAPIView):
    """POST /api/auth/login/  — authenticate and return JWT tokens."""

    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": _get_tokens(user),
            },
            status=status.HTTP_200_OK,
        )


class UserProfileView(RetrieveUpdateAPIView):
    """GET/PUT /api/auth/me/  — return or update the authenticated user's profile."""

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


# ────────────────────────────────────────────
#  Appointment Views
# ────────────────────────────────────────────

class AppointmentViewSet(viewsets.ModelViewSet):
    """Manage appointments and consultation requests (unified as FHIR Appointments)."""
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role == "patient":
            return Appointment.objects.filter(patient=user)
        elif user.role == "doctor":
            return Appointment.objects.filter(doctor=user)
        return Appointment.objects.none()

    def perform_create(self, serializer):
        # If patient creates: defaults to status="proposed" for consultation request
        if self.request.user.role == "patient":
            # Patient can request a specific doctor or leave open
            doctor_id = self.request.data.get('doctor')
            if doctor_id:
                serializer.save(patient=self.request.user, doctor_id=doctor_id)
            else:
                serializer.save(patient=self.request.user)  # doctor=None for open requests
        else:
            # If doctor creates: defaults to status="booked" for confirmed appointment
            serializer.save(doctor=self.request.user)

    @action(detail=False, methods=['get'])
    def incoming_consultations(self, request):
        """Get incoming consultation requests for the doctor (status: proposed, requested)."""
        if request.user.role != "doctor":
            return Response({"error": "Only doctors can view consultation requests"}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Doctor sees:
        # 1. Open consultation requests (doctor=NULL) with proposed/requested status
        # 2. Consultations specifically assigned to them with proposed/requested status
        consultations = self.get_queryset().filter(
            Q(doctor__isnull=True) | Q(doctor=request.user),
            status__in=["proposed", "requested"]
        ).order_by('-created_at')
        serializer = self.get_serializer(consultations, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_pending_requests(self, request):
        """Get patient's pending consultation requests (waiting for doctor response)."""
        if request.user.role != "patient":
            return Response({"error": "Only patients can view their pending requests"}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Patient sees their own appointments with proposed/requested status
        pending = self.get_queryset().filter(
            status__in=["proposed", "requested"]
        ).order_by('-created_at')
        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming appointments (next 7 days, status: booked)."""
        now = timezone.now()
        upcoming = self.get_queryset().filter(
            scheduled_at__gte=now,
            scheduled_at__lt=now + timedelta(days=7),
            status="booked"
        )
        serializer = self.get_serializer(upcoming, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's appointments (status: booked)."""
        today = timezone.now().date()
        today_appointments = self.get_queryset().filter(
            scheduled_at__date=today,
            status="booked"
        )
        serializer = self.get_serializer(today_appointments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def notifications(self, request):
        """Get appointments in the next 2 days for notifications (status: booked)."""
        now = timezone.now()
        notifications = self.get_queryset().filter(
            scheduled_at__gte=now,
            scheduled_at__lte=now + timedelta(days=2),
            status="booked"
        )
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def accept_consultation(self, request, pk=None):
        """Doctor accepts a consultation request (proposed → booked)."""
        if request.user.role != "doctor":
            return Response({"error": "Only doctors can accept consultations"}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        appointment = self.get_object()
        # Allow accepting if: (1) open request (doctor=NULL) or (2) assigned to this doctor, AND (3) status is proposed/requested
        if appointment.status not in ["proposed", "requested"]:
            return Response({"error": "This consultation cannot be accepted (invalid status: " + appointment.status + ")"}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        if appointment.doctor is not None and appointment.doctor != request.user:
            return Response({"error": "This consultation is already assigned to another doctor"}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Assign doctor and mark as booked
        appointment.doctor = request.user
        appointment.status = "booked"
        appointment.save()
        return Response({"status": "Consultation accepted", "appointment": AppointmentSerializer(appointment).data})

    @action(detail=True, methods=['post'])
    def reject_consultation(self, request, pk=None):
        """Doctor rejects a consultation request."""
        if request.user.role != "doctor":
            return Response({"error": "Only doctors can reject consultations"}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        appointment = self.get_object()
        
        # Allow rejecting if: (1) open request (doctor=NULL) or (2) assigned to this doctor, AND (3) status is proposed/requested
        if appointment.status not in ["proposed", "requested"]:
            return Response({"error": "This consultation cannot be rejected (invalid status)"}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        if appointment.doctor is not None and appointment.doctor != request.user:
            return Response({"error": "This consultation is assigned to another doctor"}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        appointment.status = "cancelled"
        appointment.save()
        return Response({"status": "Consultation rejected"})


# ────────────────────────────────────────────
#  Medical Records Views
# ────────────────────────────────────────────

class AllergyViewSet(viewsets.ModelViewSet):
    """Manage patient allergies."""
    serializer_class = AllergySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Allergy.objects.filter(patient=self.request.user)

    def perform_create(self, serializer):
        serializer.save(patient=self.request.user)


class MedicalHistoryView(GenericAPIView):
    """Get or update medical history."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            history = MedicalHistory.objects.get(patient=request.user)
            serializer = MedicalHistorySerializer(history)
            return Response(serializer.data)
        except MedicalHistory.DoesNotExist:
            return Response({}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request):
        try:
            history = MedicalHistory.objects.get(patient=request.user)
        except MedicalHistory.DoesNotExist:
            history = MedicalHistory.objects.create(patient=request.user)
        
        serializer = MedicalHistorySerializer(history, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class FamilyHistoryView(GenericAPIView):
    """Get or update family history."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            history = FamilyHistory.objects.get(patient=request.user)
            serializer = FamilyHistorySerializer(history)
            return Response(serializer.data)
        except FamilyHistory.DoesNotExist:
            return Response({}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request):
        try:
            history = FamilyHistory.objects.get(patient=request.user)
        except FamilyHistory.DoesNotExist:
            history = FamilyHistory.objects.create(patient=request.user)
        
        serializer = FamilyHistorySerializer(history, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class InsuranceView(GenericAPIView):
    """Get or update insurance information."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            insurance = Insurance.objects.get(patient=request.user)
            serializer = InsuranceSerializer(insurance)
            return Response(serializer.data)
        except Insurance.DoesNotExist:
            return Response({}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request):
        try:
            insurance = Insurance.objects.get(patient=request.user)
        except Insurance.DoesNotExist:
            insurance = Insurance.objects.create(patient=request.user)
        
        serializer = InsuranceSerializer(insurance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AdvanceDirectiveView(GenericAPIView):
    """Get or update advance directive."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            directive = AdvanceDirective.objects.get(patient=request.user)
            serializer = AdvanceDirectiveSerializer(directive)
            return Response(serializer.data)
        except AdvanceDirective.DoesNotExist:
            return Response({}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request):
        try:
            directive = AdvanceDirective.objects.get(patient=request.user)
        except AdvanceDirective.DoesNotExist:
            directive = AdvanceDirective.objects.create(patient=request.user)
        
        serializer = AdvanceDirectiveSerializer(directive, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ────────────────────────────────────────────
#  Encounter Views
# ────────────────────────────────────────────

class EncounterViewSet(viewsets.ReadOnlyModelViewSet):
    """View medical encounters."""
    serializer_class = EncounterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "patient":
            return Encounter.objects.filter(patient=user)
        elif user.role == "doctor":
            return Encounter.objects.filter(doctor=user)
        return Encounter.objects.none()


# ────────────────────────────────────────────
#  Advanced Features Views
# ────────────────────────────────────────────

# ────────────────────────────────────────────
#  Messaging Views
# ────────────────────────────────────────────

class MessageViewSet(viewsets.ModelViewSet):
    """Manage messages between doctors and patients."""
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(
            models.Q(sender=user) | models.Q(recipient=user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @action(detail=False, methods=['get'])
    def inbox(self, request):
        """Get unread messages."""
        unread = self.get_queryset().filter(recipient=request.user, read=False)
        serializer = self.get_serializer(unread, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def conversations(self, request):
        """Get unique conversations (grouped by sender)."""
        messages = self.get_queryset()
        conversations = {}
        for msg in messages:
            other_user = msg.sender if msg.recipient == request.user else msg.recipient
            if other_user.id not in conversations:
                conversations[other_user.id] = {
                    "user": UserSerializer(other_user).data,
                    "last_message": MessageSerializer(msg).data
                }
        return Response(list(conversations.values()))

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark a message as read."""
        message = self.get_object()
        if message.recipient == request.user:
            message.read = True
            message.save()
        return Response({"status": "marked as read"})


# ────────────────────────────────────────────
# ────────────────────────────────────────────
#  Prescription Views
# ────────────────────────────────────────────

class PrescriptionViewSet(viewsets.ModelViewSet):
    """Manage prescriptions."""
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering = ['-prescribed_at']

    def get_queryset(self):
        user = self.request.user
        if user.role == "patient":
            return Prescription.objects.filter(patient=user)
        elif user.role == "doctor":
            return Prescription.objects.filter(doctor=user)
        return Prescription.objects.none()

    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user)

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active prescriptions."""
        active = self.get_queryset().filter(
            status="active",
            expiry_date__gte=timezone.now().date()
        )
        serializer = self.get_serializer(active, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def expired(self, request):
        """Get expired prescriptions."""
        expired = self.get_queryset().filter(
            expiry_date__lt=timezone.now().date()
        )
        serializer = self.get_serializer(expired, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def refill(self, request, pk=None):
        """Request a refill of a prescription."""
        prescription = self.get_object()
        if prescription.refills_remaining > 0:
            prescription.refills_remaining -= 1
            prescription.save()
            return Response({"status": "refill requested", "refills_remaining": prescription.refills_remaining})
        return Response({"error": "No refills remaining"}, status=status.HTTP_400_BAD_REQUEST)


# ────────────────────────────────────────────
#  Lab Result Views
# ────────────────────────────────────────────

class LabResultViewSet(viewsets.ModelViewSet):
    """Manage lab results."""
    serializer_class = LabResultSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering = ['-ordered_at']

    def get_queryset(self):
        user = self.request.user
        if user.role == "patient":
            return LabResult.objects.filter(patient=user)
        elif user.role == "doctor":
            return LabResult.objects.filter(doctor=user)
        return LabResult.objects.none()

    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user)

    @action(detail=False, methods=['get'])
    def abnormal(self, request):
        """Get abnormal lab results."""
        abnormal = self.get_queryset().filter(is_abnormal=True)
        serializer = self.get_serializer(abnormal, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending lab results."""
        pending = self.get_queryset().filter(status="pending")
        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_reviewed(self, request, pk=None):
        """Mark lab result as reviewed by doctor."""
        result = self.get_object()
        if result.ordered_by == request.user:
            result.status = "reviewed"
            result.save()
            return Response({"status": "marked as reviewed"})
        return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)


# ────────────────────────────────────────────
#  Vital Signs Views
# ────────────────────────────────────────────

class VitalSignsViewSet(viewsets.ModelViewSet):
    """Manage vital signs records."""
    serializer_class = VitalSignsSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering = ['-measured_at']

    def get_queryset(self):
        user = self.request.user
        if user.role == "patient":
            return VitalSigns.objects.filter(patient=user)
        elif user.role == "doctor":
            return VitalSigns.objects.filter(patient__doctor_profile__doctors=user)
        return VitalSigns.objects.none()

    def perform_create(self, serializer):
        serializer.save(patient=self.request.user)

    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Get the latest vital signs."""
        latest_vitals = self.get_queryset().first()
        if latest_vitals:
            serializer = self.get_serializer(latest_vitals)
            return Response(serializer.data)
        # Return empty object for better frontend handling
        return Response({})

    @action(detail=False, methods=['get'])
    def trends(self, request):
        """Get vital signs trends for the last 30 days."""
        thirty_days_ago = timezone.now() - timedelta(days=30)
        trends = self.get_queryset().filter(measured_at__gte=thirty_days_ago)
        serializer = self.get_serializer(trends, many=True)
        return Response(serializer.data)


# ────────────────────────────────────────────
#  Medical Document Views
# ────────────────────────────────────────────

class MedicalDocumentViewSet(viewsets.ModelViewSet):
    """Manage medical documents."""
    serializer_class = MedicalDocumentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role == "patient":
            return MedicalDocument.objects.filter(
                models.Q(patient=user) | models.Q(shared_with=user)
            ).distinct()
        elif user.role == "doctor":
            return MedicalDocument.objects.filter(
                models.Q(uploaded_by=user) | models.Q(shared_with=user)
            ).distinct()
        return MedicalDocument.objects.none()

    def perform_create(self, serializer):
        serializer.save(patient=self.request.user, uploaded_by=self.request.user)

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """Share a document with a user."""
        document = self.get_object()
        user_id = request.data.get('user_id')
        try:
            user_to_share = User.objects.get(id=user_id)
            document.shared_with.add(user_to_share)
            return Response({"status": "document shared"})
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def unshare(self, request, pk=None):
        """Unshare a document from a user."""
        document = self.get_object()
        user_id = request.data.get('user_id')
        try:
            user_to_unshare = User.objects.get(id=user_id)
            document.shared_with.remove(user_to_unshare)
            return Response({"status": "document unshared"})
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def shared_with_me(self, request):
        """Get documents shared with me."""
        shared = MedicalDocument.objects.filter(shared_with=request.user)
        serializer = self.get_serializer(shared, many=True)
        return Response(serializer.data)


# ────────────────────────────────────────────
#  Referral Views
# ────────────────────────────────────────────

class ReferralViewSet(viewsets.ModelViewSet):
    """Manage referrals to specialists."""
    serializer_class = ReferralSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering = ['-requested_at']

    def get_queryset(self):
        user = self.request.user
        if user.role == "patient":
            return Referral.objects.filter(patient=user)
        elif user.role == "doctor":
            return Referral.objects.filter(
                models.Q(from_doctor=user) | models.Q(to_doctor=user)
            ).distinct()
        return Referral.objects.none()

    def perform_create(self, serializer):
        serializer.save(from_doctor=self.request.user)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending referrals."""
        pending = self.get_queryset().filter(status="pending")
        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Accept a referral as a specialist."""
        referral = self.get_object()
        if referral.referred_to == request.user and referral.status == "pending":
            referral.status = "accepted"
            referral.save()
            return Response({"status": "referral accepted"})
        return Response({"error": "Unauthorized or invalid status"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a referral."""
        referral = self.get_object()
        if referral.referred_to == request.user and referral.status == "pending":
            referral.status = "rejected"
            referral.save()
            return Response({"status": "referral rejected"})
        return Response({"error": "Unauthorized or invalid status"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark referral as complete."""
        referral = self.get_object()
        if referral.referred_to == request.user and referral.status == "accepted":
            referral.status = "completed"
            referral.save()
            return Response({"status": "referral completed"})
        return Response({"error": "Unauthorized or invalid status"}, status=status.HTTP_400_BAD_REQUEST)


# ────────────────────────────────────────────
#  Doctor/Patient Management
# ────────────────────────────────────────────

class DoctorListView(ListCreateAPIView):
    """List doctors or add a doctor to patient's provider list."""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(role="doctor")

    def list(self, request, *args, **kwargs):
        doctors = self.get_queryset()
        serializer = UserSerializer(doctors, many=True)
        return Response(serializer.data)

    def create(self, request):
        """Add a doctor to patient's provider list."""
        doctor_id = request.data.get("doctor_id")
        try:
            doctor = User.objects.get(id=doctor_id, role="doctor")
            patient_profile = request.user.patient_profile
            patient_profile.doctors.add(doctor)
            return Response({"message": "Doctor added successfully"})
        except User.DoesNotExist:
            return Response({"error": "Doctor not found"}, status=status.HTTP_404_NOT_FOUND)
        except AttributeError:
            return Response({"error": "User is not a patient"}, status=status.HTTP_400_BAD_REQUEST)


class PatientListView(ListCreateAPIView):
    """List patients for a doctor or allow doctor to assign a patient."""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(role="patient")

    def list(self, request, *args, **kwargs):
        if request.user.role != "doctor":
            return Response({"error": "Only doctors can view patients"}, status=status.HTTP_403_FORBIDDEN)
        
        # Get patients linked to this doctor via two methods:
        # 1. Manually assigned (PatientProfile.doctors M2M)
        manually_assigned = PatientProfile.objects.filter(doctors=request.user).values_list('user', flat=True)
        
        # 2. Linked through active Appointments (booked consultations)
        appointment_patients = Appointment.objects.filter(
            doctor=request.user,
            status__in=["proposed", "requested", "booked", "completed"]
        ).values_list('patient', flat=True).distinct()
        
        # Combine both sets (remove duplicates)
        all_patient_ids = set(manually_assigned) | set(appointment_patients)
        
        patient_users = User.objects.filter(id__in=all_patient_ids)
        serializer = UserSerializer(patient_users, many=True)
        return Response(serializer.data)

    def create(self, request):
        """Doctor assigns a patient to themselves."""
        if request.user.role != "doctor":
            return Response({"error": "Only doctors can assign patients"}, status=status.HTTP_403_FORBIDDEN)
        
        patient_id = request.data.get("patient_id")
        try:
            patient = User.objects.get(id=patient_id, role="patient")
            patient_profile = patient.patient_profile
            patient_profile.doctors.add(request.user)
            return Response({
                "message": "Patient assigned successfully",
                "patient": UserSerializer(patient).data
            })
        except User.DoesNotExist:
            return Response({"error": "Patient not found"}, status=status.HTTP_404_NOT_FOUND)
        except AttributeError:
            return Response({"error": "User is not a patient"}, status=status.HTTP_400_BAD_REQUEST)


# ────────────────────────────────────────────
#  DICOM Imaging Views
# ────────────────────────────────────────────

class DICOMStudyViewSet(viewsets.ModelViewSet):
    """Manage DICOM medical imaging studies."""
    serializer_class = DICOMStudySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering = ['-study_date']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == "patient":
            return DICOMStudy.objects.filter(patient=user)
        elif user.role == "doctor":
            return DICOMStudy.objects.filter(
                models.Q(ordering_doctor=user) |
                models.Q(patient__patient_profile__doctors=user)
            ).distinct()
        return DICOMStudy.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(ordering_doctor=self.request.user)
    
    @action(detail=False, methods=['get'])
    def pending_review(self, request):
        """Get DICOM studies pending review."""
        pending = self.get_queryset().filter(is_reviewed=False)
        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='upload-local')
    def upload_local(self, request):
        """Upload a DICOM study from a local folder path on the doctor's machine."""
        folder_path = request.data.get('folder_path')
        patient_id = request.data.get('patient_id')
        print(f"DEBUG: upload_local called for patient_id={patient_id}, path={folder_path}")
        
        if not folder_path or not patient_id:
            return Response({"error": "folder_path and patient_id are required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            patient = User.objects.get(id=patient_id, role="patient")
        except User.DoesNotExist:
            print(f"DEBUG: Patient not found for ID {patient_id}")
            return Response({"error": "Patient not found."}, status=status.HTTP_404_NOT_FOUND)
            
        import os
        # Cleanup quotes and normalize the path for the current OS
        if folder_path:
            folder_path = folder_path.strip('"\'').strip()
            folder_path = os.path.normpath(folder_path)
        
        if not os.path.exists(folder_path) or not os.path.isdir(folder_path):
            print(f"DEBUG: Directory not found or invalid: {folder_path}")
            return Response({"error": f"Directory not found or invalid: {folder_path}"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Try to read the first DICOM to extract metadata
        try:
            import pydicom
            from datetime import datetime
            
            # RECURSIVE SEARCH for DICOM files
            all_dicom_files = []
            for root, dirs, files in os.walk(folder_path):
                for f in files:
                    if f.lower().endswith('.ima') or f.lower().endswith('.dcm'):
                        all_dicom_files.append(os.path.join(root, f))
            
            if not all_dicom_files:
                print(f"DEBUG: No DICOM files found recursively in {folder_path}")
                return Response({"error": f"No .IMA or .dcm files found anywhere inside: {folder_path}"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Sort files to get a consistent representative file
            all_dicom_files.sort()
            example_file = all_dicom_files[0]
            print(f"DEBUG: Found {len(all_dicom_files)} files. Reading header from {example_file}")
            
            # Use force=True to read files without DICOM preamble
            ds = pydicom.dcmread(example_file, stop_before_pixels=True, force=True)
            
            # Get Study UID or Fallback
            study_uid = getattr(ds, 'StudyInstanceUID', None)
            if not study_uid:
                # If no Study UID, use the folder name + timestamp to group them
                study_uid = f"LOCAL.{os.path.basename(folder_path)}.{int(datetime.now().timestamp())}"
            
            modality = getattr(ds, 'Modality', 'OT')
            body_part = getattr(ds, 'BodyPartExamined', 'Unknown')
            
            study_date_str = getattr(ds, 'StudyDate', '')
            if study_date_str and len(study_date_str) == 8:
                try:
                    study_date = datetime.strptime(study_date_str, '%Y%m%d').date()
                except:
                    study_date = datetime.now().date()
            else:
                study_date = datetime.now().date()
                
            # Create the record mapped to the local path
            # We use update_or_create to avoid duplicate study ID crashes if they re-import
            study, created = DICOMStudy.objects.update_or_create(
                study_id=study_uid,
                defaults={
                    'patient': patient,
                    'ordering_doctor': request.user,
                    'modality': modality,
                    'body_part': body_part,
                    'study_date': study_date,
                    'local_folder_path': folder_path,
                    'number_of_images': len(all_dicom_files),
                    'institution_name': getattr(ds, 'InstitutionName', 'Local Workstation'),
                    'status': 'completed'
                }
            )
            
            msg = "Local study linked." if created else "Local study updated."
            print(f"DEBUG: {msg} ID {study.id} (UID: {study_uid})")
            return Response({"message": msg, "study_id": study.id}, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": f"Internal server error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DICOMSeriesViewSet(viewsets.ReadOnlyModelViewSet):
    """View DICOM series within a study."""
    queryset = DICOMSeries.objects.all()
    serializer_class = DICOMSeriesSerializer
    permission_classes = [IsAuthenticated]


# ────────────────────────────────────────────
#  HL7 Message Views
# ────────────────────────────────────────────

class HL7MessageViewSet(viewsets.ModelViewSet):
    """Manage HL7v2 messages for healthcare system integration."""
    serializer_class = HL7MessageSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering = ['-received_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == "patient":
            return HL7Message.objects.filter(patient=user)
        elif user.role == "doctor":
            return HL7Message.objects.filter(
                models.Q(doctor=user) |
                models.Q(patient__patient_profile__doctors=user)
            ).distinct()
        return HL7Message.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get HL7 messages pending processing."""
        pending = self.get_queryset().filter(message_status='pending')
        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_processed(self, request, pk=None):
        """Mark HL7 message as processed."""
        message = self.get_object()
        message.message_status = 'processed'
        message.processed_at = timezone.now()
        message.save()
        return Response({'status': 'message marked as processed'})


# ────────────────────────────────────────────
#  FHIR Export Views
# ────────────────────────────────────────────

class FHIRPatientExportView(GenericAPIView):
    """Export patient data as FHIR Patient resource."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Export authenticated patient's data as FHIR Patient resource."""
        user = request.user
        if user.role != "patient":
            return Response({"error": "Only patients can export their own data"}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Get or create patient profile
        patient_profile, _ = PatientProfile.objects.get_or_create(user=user)
        
        fhir_patient = {
            "resourceType": "Patient",
            "id": str(user.id),
            "identifier": [
                {
                    "system": "urn:example:mrn",
                    "value": f"MRN{user.id:06d}"
                }
            ],
            "name": [
                {
                    "use": "official",
                    "given": [user.first_name],
                    "family": user.last_name
                }
            ],
            "telecom": [
                {
                    "system": "email",
                    "value": user.email
                }
            ],
            "birthDate": str(patient_profile.date_of_birth) if patient_profile.date_of_birth else None,
            "contact": [
                {
                    "telecom": [
                        {
                            "system": "phone",
                            "value": patient_profile.phone_number or ""
                        }
                    ]
                }
            ]
        }
        
        # Log the export
        FHIRResourceLog.objects.create(
            resource_type="Patient",
            local_object_id=str(user.id),
            fhir_resource_id=str(user.id),
            fhir_server_url=request.build_absolute_uri('/'),
            fhir_payload=fhir_patient,
            sync_status="synced"
        )
        
        return Response(fhir_patient)


class FHIRPractitionerExportView(GenericAPIView):
    """Export doctor data as FHIR Practitioner resource."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Export authenticated doctor's data as FHIR Practitioner resource."""
        user = request.user
        if user.role != "doctor":
            return Response({"error": "Only doctors can export their practitioner data"}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Get or create doctor profile
        doctor_profile, _ = DoctorProfile.objects.get_or_create(user=user)
        
        fhir_practitioner = {
            "resourceType": "Practitioner",
            "id": str(user.id),
            "identifier": [
                {
                    "system": "urn:example:license",
                    "value": doctor_profile.license_number or f"LIC{user.id:06d}"
                }
            ],
            "name": [
                {
                    "use": "official",
                    "given": [user.first_name],
                    "family": user.last_name
                }
            ],
            "telecom": [
                {
                    "system": "email",
                    "value": user.email
                }
            ],
            "qualification": [
                {
                    "code": {
                        "text": doctor_profile.specialty or "General Medicine"
                    }
                }
            ]
        }
        
        # Log the export
        FHIRResourceLog.objects.create(
            resource_type="Practitioner",
            local_object_id=str(user.id),
            fhir_resource_id=str(user.id),
            fhir_server_url=request.build_absolute_uri('/'),
            fhir_payload=fhir_practitioner,
            sync_status="synced"
        )
        
        return Response(fhir_practitioner)


class FHIRAppointmentExportView(RetrieveAPIView):
    """GET /api/auth/fhir/export/appointment/{id}/ — export appointment as FHIR Appointment resource."""
    permission_classes = [IsAuthenticated]

    def retrieve(self, request, pk=None):
        appointment = Appointment.objects.filter(pk=pk).first()
        if not appointment:
            return Response({"error": "Appointment not found"}, status=status.HTTP_404_NOT_FOUND)

        # Check permissions
        if request.user != appointment.patient and request.user != appointment.doctor:
            return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)

        # Build FHIR Appointment
        fhir_appointment = {
            "resourceType": "Appointment",
            "id": str(appointment.id),
            "status": appointment.status.lower(),  # proposed, pending, booked, arrived, fulfilled, cancelled, noshow, entered-in-error, checked-in, waitlist
            "serviceType": [
                {
                    "coding": [{"system": "http://terminology.hl7.org/CodeSystem/service-type", "code": "57"}],
                    "text": appointment.type
                }
            ],
            "description": appointment.reason,
            "start": appointment.scheduled_at.isoformat(),
            "participant": [
                {
                    "actor": {
                        "reference": f"Patient/{appointment.patient.id}",
                        "display": appointment.patient.get_full_name()
                    },
                    "status": "accepted"
                },
                {
                    "actor": {
                        "reference": f"Practitioner/{appointment.doctor.id}",
                        "display": appointment.doctor.get_full_name()
                    },
                    "status": "accepted"
                }
            ],
            "created": appointment.created_at.isoformat() if hasattr(appointment, 'created_at') else None
        }

        # Log FHIR export
        FHIRResourceLog.objects.create(
            resource_type="Appointment",
            local_object_id=str(appointment.id),
            fhir_resource_id=str(appointment.id),
            fhir_server_url=request.build_absolute_uri('/'),
            fhir_payload=fhir_appointment,
            sync_status="synced"
        )

        return Response(fhir_appointment)


class FHIRServiceRequestListView(APIView):
    """List consultation ServiceRequest resources from FHIR for the current doctor."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retrieve ServiceRequest resources for the current doctor."""
        try:
            user = request.user
            
            # Only doctors can retrieve consultations assigned to them
            if user.role != "doctor":
                return Response({"error": "Only doctors can view assigned consultations"}, status=403)

            # Query FHIRResourceLog for ServiceRequest resources where this doctor is the performer
            fhir_logs = FHIRResourceLog.objects.filter(
                resource_type="ServiceRequest"
            )

            servicerequests = []
            for log in fhir_logs:
                payload = log.fhir_payload
                # Check if this doctor is the performer
                performers = payload.get("performer", [])
                is_assigned = any(
                    p.get("reference", "").endswith(f"Practitioner/{user.id}") 
                    for p in performers
                )
                if is_assigned:
                    servicerequests.append(payload)

            return Response(servicerequests)
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class FHIRServiceRequestExportView(APIView):
    """Export consultation as FHIR ServiceRequest resource."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """Export consultation to FHIR ServiceRequest."""
        try:
            consultation = Consultation.objects.get(id=pk)
            
            # Verify user is either patient or doctor in this consultation
            if consultation.patient != request.user and consultation.doctor != request.user:
                return Response({"error": "Not authorized"}, status=403)

            # Build FHIR ServiceRequest
            fhir_servicerequest = {
                "resourceType": "ServiceRequest",
                "id": str(consultation.id),
                "status": consultation.status if consultation.status != "pending" else "draft",
                "intent": "order",
                "category": [{
                    "coding": [{
                        "system": "http://snomed.info/sct",
                        "code": "108252007",
                        "display": "Consultation"
                    }]
                }],
                "code": {
                    "text": f"{consultation.consultation_type} Consultation"
                },
                "subject": {
                    "reference": f"Patient/{consultation.patient.id}",
                    "display": consultation.patient.get_full_name() or consultation.patient.email
                },
                "requester": {
                    "reference": f"Patient/{consultation.patient.id}",
                    "display": consultation.patient.get_full_name() or consultation.patient.email
                },
                "performer": [{
                    "reference": f"Practitioner/{consultation.doctor.id}",
                    "display": consultation.doctor.get_full_name() or consultation.doctor.email
                }],
                "reasonCode": [{
                    "text": consultation.reason
                }],
                "authoredOn": consultation.created_at.isoformat(),
                "meta": {
                    "profile": ["http://hl7.org/fhir/StructureDefinition/ServiceRequest"]
                }
            }

            # Log to FHIRResourceLog
            FHIRResourceLog.objects.create(
                resource_type="ServiceRequest",
                local_object_id=str(consultation.id),
                fhir_resource_id=str(consultation.id),
                fhir_server_url=request.build_absolute_uri('/'),
                fhir_payload=fhir_servicerequest,
                sync_status="synced"
            )

            return Response(fhir_servicerequest)
        except Consultation.DoesNotExist:
            return Response({"error": "Consultation not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class FHIRResourceLogViewSet(viewsets.ReadOnlyModelViewSet):
    """View FHIR resource sync logs."""
    queryset = FHIRResourceLog.objects.all()
    serializer_class = FHIRResourceLogSerializer
    permission_classes = [IsAuthenticated]
    ordering = ['-created_at']


# ────────────────────────────────────────────
#  Notification Views
# ────────────────────────────────────────────

class NotificationViewSet(viewsets.ModelViewSet):
    """Manage notifications for the current user."""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering = ['-created_at']

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({"status": "all marked as read"})

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({"status": "marked as read"})


# ────────────────────────────────────────────
#  Triage & Clinical Assessment Views
# ────────────────────────────────────────────

class TriageScoreViewSet(viewsets.ModelViewSet):
    """Create and manage triage scores for patient urgency assessment."""
    serializer_class = TriageScoreSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering = ['-created_at']

    def get_queryset(self):
        if self.request.user.role == "doctor":
            # Doctors see triage scores they assigned
            return TriageScore.objects.filter(doctor=self.request.user)
        elif self.request.user.role == "patient":
            # Patients see their own triage scores
            return TriageScore.objects.filter(patient=self.request.user)
        return TriageScore.objects.none()

    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user)

    @action(detail=False, methods=['get'])
    def by_patient(self, request):
        """Get all triage scores for a specific patient (for doctors)."""
        patient_id = request.query_params.get('patient_id')
        if not patient_id:
            return Response({"error": "patient_id required"}, status=status.HTTP_400_BAD_REQUEST)
        
        if request.user.role != "doctor":
            return Response({"error": "Only doctors can view patient triage scores"}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        scores = TriageScore.objects.filter(patient_id=patient_id, doctor=request.user).order_by('-created_at')
        serializer = self.get_serializer(scores, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def urgent_patients(self, request):
        """Get all urgent/critical patients (for doctor dashboard)."""
        if request.user.role != "doctor":
            return Response({"error": "Only doctors can view urgent patients"}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        urgent_scores = TriageScore.objects.filter(
            doctor=request.user,
            urgency_level__in=["resuscitation", "emergency", "urgent"]
        ).order_by('-created_at')
        serializer = self.get_serializer(urgent_scores, many=True)
        return Response(serializer.data)


class ConsultationNoteViewSet(viewsets.ModelViewSet):
    """Create and manage clinical consultation notes."""
    serializer_class = ConsultationNoteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering = ['-created_at']

    def get_queryset(self):
        if self.request.user.role == "doctor":
            # Doctors see notes they wrote
            return ConsultationNote.objects.filter(doctor=self.request.user)
        elif self.request.user.role == "patient":
            # Patients see their own consultation notes
            return ConsultationNote.objects.filter(patient=self.request.user)
        return ConsultationNote.objects.none()

    def perform_create(self, serializer):
        user_name = self.request.user.get_full_name()
        serializer.save(doctor=self.request.user, created_by_full_name=user_name)

    @action(detail=False, methods=['get'])
    def by_appointment(self, request):
        """Get all consultation notes for a specific appointment."""
        appointment_id = request.query_params.get('appointment_id')
        if not appointment_id:
            return Response({"error": "appointment_id required"}, status=status.HTTP_400_BAD_REQUEST)
        
        notes = ConsultationNote.objects.filter(appointment_id=appointment_id).order_by('-created_at')
        serializer = self.get_serializer(notes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_patient(self, request):
        """Get all consultation notes for a specific patient."""
        patient_id = request.query_params.get('patient_id')
        if not patient_id:
            return Response({"error": "patient_id required"}, status=status.HTTP_400_BAD_REQUEST)
        
        if request.user.role == "doctor":
            notes = ConsultationNote.objects.filter(patient_id=patient_id, doctor=request.user).order_by('-created_at')
        elif request.user.role == "patient" and request.user.id == int(patient_id):
            notes = ConsultationNote.objects.filter(patient_id=patient_id).order_by('-created_at')
        else:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(notes, many=True)
        return Response(serializer.data)


class PatientEventTimelineViewSet(viewsets.ReadOnlyModelViewSet):
    """View patient event timeline (chronological history of appointments, results, etc)."""
    serializer_class = PatientEventTimelineSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering = ['-event_date']

    def get_queryset(self):
        patient_id = self.request.query_params.get('patient_id')
        
        if not patient_id:
            if self.request.user.role == "patient":
                patient_id = self.request.user.id
            else:
                return PatientEventTimeline.objects.none()
        
        # Check permissions
        if self.request.user.role == "doctor":
            # Doctor can only view timeline for their assigned patients
            from django.db.models import Q
            patient = User.objects.filter(id=patient_id, role="patient").first()
            if not patient:
                return PatientEventTimeline.objects.none()
            
            # Check if doctor has this patient
            has_patient = PatientProfile.objects.filter(
                doctors=self.request.user, user_id=patient_id
            ).exists() or Appointment.objects.filter(
                doctor=self.request.user, patient_id=patient_id,
                status__in=["proposed", "requested", "booked", "completed"]
            ).exists()
            
            if not has_patient:
                return PatientEventTimeline.objects.none()
        
        elif self.request.user.role == "patient" and int(patient_id) != self.request.user.id:
            # Patients can only view their own timeline
            return PatientEventTimeline.objects.none()
        
        return PatientEventTimeline.objects.filter(patient_id=patient_id).order_by('-event_date')

    @action(detail=False, methods=['get'])
    def critical_events(self, request):
        """Get critical events for patient timeline."""
        patient_id = request.query_params.get('patient_id')
        if not patient_id:
            if request.user.role == "patient":
                patient_id = request.user.id
            else:
                return Response({"error": "patient_id required"}, status=status.HTTP_400_BAD_REQUEST)
        
        events = PatientEventTimeline.objects.filter(
            patient_id=patient_id,
            is_critical=True
        ).order_by('-event_date')[:20]
        
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)
