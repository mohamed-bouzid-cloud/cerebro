"""
Signals for automatic FHIR export and other model operations.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
<<<<<<< HEAD
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Consultation, Appointment, FHIRResourceLog


@receiver(post_save, sender=Appointment)
def handle_appointment_updates(sender, instance, created, **kwargs):
    """
    1. Auto-export appointment to FHIR.
    2. Notify waiting room if status changed to 'confirmed' or 'completed'.
    """
    # 1. FHIR Sync
    try:
        # Build FHIR Appointment
        fhir_appointment = {
            "resourceType": "Appointment",
            "id": str(instance.id),
            "status": "booked" if instance.status in ["scheduled", "confirmed"] else 
                      "fulfilled" if instance.status == "completed" else "cancelled",
            "start": instance.scheduled_at.isoformat(),
            "end": (instance.scheduled_at).isoformat(), # Simplified
            "participant": [
                {
                    "actor": {"reference": f"Patient/{instance.patient.id}", "display": instance.patient.get_full_name()},
                    "status": "accepted"
                },
                {
                    "actor": {"reference": f"Practitioner/{instance.doctor.id}", "display": f"Dr. {instance.doctor.get_full_name()}"},
                    "status": "accepted"
                }
            ],
            "description": instance.notes,
            "meta": {"profile": ["http://hl7.org/fhir/StructureDefinition/Appointment"]}
        }

        # Use update_or_create to handle updates
        FHIRResourceLog.objects.update_or_create(
            resource_type="Appointment",
            local_object_id=str(instance.id),
            defaults={
                "fhir_resource_id": str(instance.id),
                "fhir_payload": fhir_appointment,
                "sync_status": "synced"
            }
        )
    except Exception as e:
        print(f"⚠ FHIR Sync failed for Appointment {instance.id}: {e}")

    # 2. Waiting Room Notification
    if instance.status in ["confirmed", "completed", "no-show"]:
        channel_layer = get_channel_layer()
        action = "add" if instance.status == "confirmed" else "remove"
        
        async_to_sync(channel_layer.group_send)(
            "waiting_room",
            {
                "type": "queue_update",
                "action": action,
                "appointment": {
                    "id": instance.id,
                    "patient_name": instance.patient.get_full_name(),
                    "patient_id": instance.patient.id,
                    "status": instance.status,
                    "scheduled_at": instance.scheduled_at.isoformat(),
                    "notes": instance.notes
                }
            }
        )


@receiver(post_save, sender=Consultation)
def auto_export_consultation_to_fhir(sender, instance, created, **kwargs):
    """
    Auto-export consultations to FHIR ServiceRequest on creation or update.
    This ensures consultations created through Django admin also get exported.
    """
    # Only auto-export on creation or if status changed to "requested"
    if not created and instance.status != "requested":
        return  # Only export new or newly-requested consultations
    
    try:
        # Check if already exported (to avoid duplicates)
        existing = FHIRResourceLog.objects.filter(
            resource_type="ServiceRequest",
            local_object_id=str(instance.id)
        ).exists()
        
        if existing:
            return  # Already exported
        
        # Build FHIR ServiceRequest
        fhir_servicerequest = {
            "resourceType": "ServiceRequest",
            "id": str(instance.id),
            "status": instance.status if instance.status != "pending" else "draft",
            "intent": "order",
            "category": [{
                "coding": [{
                    "system": "http://snomed.info/sct",
                    "code": "108252007",
                    "display": "Consultation"
                }]
            }],
            "code": {
                "text": f"{instance.consultation_type} Consultation"
            },
            "subject": {
                "reference": f"Patient/{instance.patient.id}",
                "display": instance.patient.get_full_name() or instance.patient.email
            },
            "requester": {
                "reference": f"Patient/{instance.patient.id}",
                "display": instance.patient.get_full_name() or instance.patient.email
            },
            "performer": [{
                "reference": f"Practitioner/{instance.doctor.id}",
                "display": instance.doctor.get_full_name() or instance.doctor.email
            }],
            "reasonCode": [{
                "text": instance.reason
            }],
            "authoredOn": instance.created_at.isoformat(),
            "meta": {
                "profile": ["http://hl7.org/fhir/StructureDefinition/ServiceRequest"]
            }
        }
        
        # Create FHIR log entry
        FHIRResourceLog.objects.create(
            resource_type="ServiceRequest",
            local_object_id=str(instance.id),
            fhir_resource_id=str(instance.id),
            fhir_server_url="",
            fhir_payload=fhir_servicerequest,
            sync_status="synced"
        )
        print(f"✓ Consultation {instance.id} auto-exported to FHIR")
        
    except Exception as e:
        print(f"⚠ Failed to auto-export consultation {instance.id} to FHIR: {e}")
        # Don't raise - let the consultation save succeed even if FHIR export fails
=======
from django.utils import timezone
from django.conf import settings
from .models import FHIRResourceLog, Appointment


@receiver(post_save, sender=Appointment)
def sync_appointment_to_fhir(sender, instance, created, **kwargs):
    """
    Sync appointments to FHIR server on creation or status update.
    This is the KEY signal for real-time FHIR appointment synchronization.
    """
    if not getattr(settings, 'FHIR_SYNC_ENABLED', True):
        return  # FHIR sync disabled
    
    try:
        from .fhir_service import fhir_service
        
        # Only sync if status is pending or first-time creation
        if instance.fhir_sync_status == "failed":
            # Retry failed syncs
            pass
        elif not created and instance.fhir_sync_status == "synced":
            # Already synced, don't resync unless status changed
            return
        
        # Create/update appointment on FHIR server
        success, fhir_id, response = fhir_service.create_appointment(instance)
        
        if success:
            # Update the local appointment with FHIR resource ID
            instance.fhir_resource_id = fhir_id
            instance.fhir_sync_status = "synced"
            instance.fhir_last_synced = timezone.now()
            instance.fhir_sync_error = ""
            # Save without triggering signal again
            Appointment.objects.filter(id=instance.id).update(
                fhir_resource_id=fhir_id,
                fhir_sync_status="synced",
                fhir_last_synced=timezone.now(),
                fhir_sync_error=""
            )
            print(f"✓ Appointment {instance.id} synced to FHIR (ID: {fhir_id})")
        else:
            error_msg = response.get('error', 'Unknown error')
            instance.fhir_sync_status = "failed"
            instance.fhir_sync_error = error_msg
            Appointment.objects.filter(id=instance.id).update(
                fhir_sync_status="failed",
                fhir_sync_error=error_msg
            )
            print(f"⚠ Failed to sync appointment {instance.id} to FHIR: {error_msg}")
            
    except Exception as e:
        print(f"⚠ Exception while syncing appointment {instance.id} to FHIR: {e}")
        import traceback
        traceback.print_exc()
        # Update sync status to failed but don't raise exception
        Appointment.objects.filter(id=instance.id).update(
            fhir_sync_status="failed",
            fhir_sync_error=str(e)
        )
>>>>>>> b381c81bab0b6500d6e25aa0d8e664d8397d0550
