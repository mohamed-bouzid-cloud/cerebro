"""
Signals for automatic FHIR export and other model operations.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
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
