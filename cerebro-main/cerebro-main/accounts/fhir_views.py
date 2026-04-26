"""
FHIR Appointment REST API Views
Handles real-time appointment synchronization with FHIR servers.
"""
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.conf import settings
from django.db import models

from .models import Appointment, PatientProfile, DoctorProfile, User
from .serializers import AppointmentSerializer
from .fhir_service import fhir_service


class FHIRAppointmentViewSet(viewsets.ViewSet):
    """
    FHIR Appointment operations.
    Syncs appointments with FHIR server in real-time.
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def fhir_list(self, request):
        """
        GET /appointments/fhir/list/
        Fetch appointments from FHIR server for the current user.
        - For patients: Returns appointments where they are a participant
        - For doctors: Returns appointments where they are the practitioner
        """
        user = request.user
        
        if not getattr(settings, 'FHIR_SYNC_ENABLED', True):
            return Response(
                {"error": "FHIR sync disabled", "fallback": "Using local database"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        if user.role == "patient":
            # Get patient's FHIR ID or use user ID
            fhir_id = user.fhir_resource_id or str(user.id)
            success, fhir_appointments = fhir_service.search_appointments_for_patient(fhir_id)
        elif user.role == "doctor":
            # Get doctor's FHIR ID or use user ID
            fhir_id = user.fhir_resource_id or str(user.id)
            success, fhir_appointments = fhir_service.search_appointments_for_practitioner(fhir_id)
        else:
            return Response(
                {"error": "Invalid user role"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not success:
            # Fall back to local database on FHIR server error
            if user.role == "patient":
                local_appointments = Appointment.objects.filter(patient=user)
            else:
                local_appointments = Appointment.objects.filter(doctor=user)
            
            serializer = AppointmentSerializer(local_appointments, many=True)
            return Response({
                "source": "fallback",
                "message": "FHIR server unavailable, using local data",
                "data": serializer.data
            })
        
        return Response({
            "source": "fhir_server",
            "data": fhir_appointments
        })
    
    @action(detail=False, methods=['post'])
    def sync_to_fhir(self, request):
        """
        POST /appointments/fhir/sync/
        Manually sync pending appointments to FHIR server.
        Used to retry failed syncs.
        """
        user = request.user
        
        if user.role != "doctor" and user.role != "patient":
            return Response(
                {"error": "Invalid user role"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get appointments with pending sync status
        if user.role == "patient":
            pending_appointments = Appointment.objects.filter(
                patient=user,
                fhir_sync_status__in=["pending", "failed"]
            )
        else:
            pending_appointments = Appointment.objects.filter(
                doctor=user,
                fhir_sync_status__in=["pending", "failed"]
            )
        
        results = []
        for appointment in pending_appointments:
            # Trigger FHIR sync via signal
            appointment.save()  # This will trigger the signal
            results.append({
                "id": appointment.id,
                "status": appointment.fhir_sync_status,
                "error": appointment.fhir_sync_error
            })
        
        return Response({
            "message": f"Synced {len(results)} appointments",
            "results": results
        })
    
    @action(detail=False, methods=['post'])
    def fetch_and_sync(self, request):
        """
        POST /appointments/fhir/fetch-and-sync/
        Fetch appointments from FHIR server and create/update local records.
        This ensures real-time consistency.
        """
        user = request.user
        
        if not getattr(settings, 'FHIR_SYNC_ENABLED', True):
            return Response(
                {"error": "FHIR sync disabled"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        if user.role == "patient":
            fhir_id = user.fhir_resource_id or str(user.id)
            success, fhir_appointments = fhir_service.search_appointments_for_patient(fhir_id)
        elif user.role == "doctor":
            fhir_id = user.fhir_resource_id or str(user.id)
            success, fhir_appointments = fhir_service.search_appointments_for_practitioner(fhir_id)
        else:
            return Response(
                {"error": "Invalid user role"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not success:
            return Response(
                {"error": "Failed to fetch from FHIR server"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        # Parse and create/update local appointments from FHIR resources
        synced_count = 0
        errors = []
        
        for fhir_appt in fhir_appointments:
            try:
                # Extract data from FHIR Appointment resource
                fhir_id_value = fhir_appt.get('id')
                status_map = {
                    'booked': 'scheduled',
                    'fulfilled': 'completed',
                    'cancelled': 'cancelled',
                    'noshow': 'cancelled',
                }
                appt_status = status_map.get(fhir_appt.get('status', 'booked'), 'scheduled')
                
                # Find participants
                patient_user = None
                doctor_user = None
                
                participants = fhir_appt.get('participant', [])
                for participant in participants:
                    actor = participant.get('actor', {})
                    ref = actor.get('reference', '')
                    
                    if 'Patient/' in ref:
                        try:
                            patient_id = ref.split('/')[-1]
                            patient_user = User.objects.get(id=patient_id, role='patient')
                        except:
                            pass
                    elif 'Practitioner/' in ref:
                        try:
                            doctor_id = ref.split('/')[-1]
                            doctor_user = User.objects.get(id=doctor_id, role='doctor')
                        except:
                            pass
                
                if not patient_user or not doctor_user:
                    errors.append({
                        'fhir_id': fhir_id_value,
                        'error': 'Could not find patient or doctor'
                    })
                    continue
                
                # Parse appointment details
                from datetime import datetime
                start_time_str = fhir_appt.get('start')
                if start_time_str:
                    scheduled_at = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
                else:
                    scheduled_at = timezone.now()
                
                # Create or update appointment
                appointment, created = Appointment.objects.update_or_create(
                    fhir_resource_id=fhir_id_value,
                    defaults={
                        'patient': patient_user,
                        'doctor': doctor_user,
                        'scheduled_at': scheduled_at,
                        'status': appt_status,
                        'notes': fhir_appt.get('comment', ''),
                        'fhir_sync_status': 'synced',
                        'fhir_last_synced': timezone.now(),
                    }
                )
                synced_count += 1
                
            except Exception as e:
                errors.append({
                    'fhir_id': fhir_appt.get('id'),
                    'error': str(e)
                })
        
        return Response({
            "message": f"Synced {synced_count} appointments from FHIR server",
            "synced_count": synced_count,
            "errors": errors if errors else None
        })


class FHIRDoctorDashboardView(GenericAPIView):
    """
    GET /fhir/doctor-dashboard/
    Real-time doctor dashboard that fetches appointments from FHIR server.
    Shows live appointment data for the doctor.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get doctor's dashboard with FHIR appointments."""
        user = request.user
        
        if user.role != "doctor":
            return Response(
                {"error": "Only doctors can access doctor dashboard"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not getattr(settings, 'FHIR_SYNC_ENABLED', True):
            # Fallback to local database
            return self._get_local_dashboard(user)
        
        # Fetch from FHIR server
        fhir_id = user.fhir_resource_id or str(user.id)
        success, fhir_appointments = fhir_service.search_appointments_for_practitioner(fhir_id)
        
        if not success:
            # Fall back to local database
            return self._get_local_dashboard(user)
        
        # Parse FHIR appointments into dashboard format
        upcoming = []
        today_appts = []
        past = []
        
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + __import__('datetime').timedelta(days=1)
        
        for fhir_appt in fhir_appointments:
            try:
                start_str = fhir_appt.get('start')
                if start_str:
                    from datetime import datetime
                    appointment_time = datetime.fromisoformat(start_str.replace('Z', '+00:00'))
                else:
                    continue
                
                # Find patient
                patient_name = "Unknown Patient"
                participants = fhir_appt.get('participant', [])
                for participant in participants:
                    actor = participant.get('actor', {})
                    if 'Patient/' in actor.get('reference', ''):
                        patient_name = actor.get('display', 'Unknown Patient')
                        break
                
                appt_data = {
                    "id": fhir_appt.get('id'),
                    "patient": patient_name,
                    "scheduled_at": start_str,
                    "status": fhir_appt.get('status'),
                    "notes": fhir_appt.get('comment', '')
                }
                
                if appointment_time >= today_start and appointment_time < today_end:
                    today_appts.append(appt_data)
                elif appointment_time >= now:
                    upcoming.append(appt_data)
                else:
                    past.append(appt_data)
                    
            except Exception as e:
                print(f"Error parsing FHIR appointment: {e}")
                continue
        
        return Response({
            "source": "fhir_server",
            "doctor": {
                "id": user.id,
                "name": user.get_full_name(),
                "email": user.email
            },
            "appointments": {
                "today": today_appts,
                "upcoming": upcoming[:7],  # Next 7 days
                "past": past[:20]  # Last 20
            },
            "summary": {
                "total_appointments": len(fhir_appointments),
                "today_count": len(today_appts),
                "upcoming_count": len(upcoming)
            }
        })
    
    def _get_local_dashboard(self, user):
        """Fallback to local database."""
        from django.db.models import Count
        
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + __import__('datetime').timedelta(days=1)
        
        today_appts = Appointment.objects.filter(
            doctor=user,
            scheduled_at__gte=today_start,
            scheduled_at__lt=today_end,
            status="scheduled"
        )
        
        upcoming_appts = Appointment.objects.filter(
            doctor=user,
            scheduled_at__gte=now,
            scheduled_at__lt=now + __import__('datetime').timedelta(days=7),
            status="scheduled"
        )
        
        serializer = AppointmentSerializer(today_appts, many=True)
        upcoming_serializer = AppointmentSerializer(upcoming_appts, many=True)
        
        return Response({
            "source": "fallback",
            "message": "FHIR server unavailable, using local data",
            "doctor": {
                "id": user.id,
                "name": user.get_full_name(),
                "email": user.email
            },
            "appointments": {
                "today": serializer.data,
                "upcoming": upcoming_serializer.data
            }
        })
