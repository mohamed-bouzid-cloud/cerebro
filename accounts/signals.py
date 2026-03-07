"""
Signals for automatic FHIR export and other model operations.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Consultation, FHIRResourceLog


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
