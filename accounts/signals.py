"""
Signals for automatic FHIR export and other model operations.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
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
