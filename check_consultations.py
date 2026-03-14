#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cerebro.settings')
django.setup()

from accounts.models import Consultation, User, FHIRResourceLog

# Show all consultations
print("=== ALL CONSULTATIONS ===")
for c in Consultation.objects.all().order_by('-id')[:10]:
    doc_str = f"{c.doctor.email} (ID:{c.doctor.id})" if c.doctor else "NONE"
    pat_str = f"{c.patient.email} (ID:{c.patient.id})" if c.patient else "NONE"
    print(f"ID: {c.id}, Type: {c.consultation_type}, Doctor: {doc_str}, Patient: {pat_str}")

# Show which doctors have consultations
print("\n=== DOCTOR STATS ===")
for user in User.objects.filter(role='doctor'):
    count = Consultation.objects.filter(doctor=user).count()
    print(f"{user.email} (ID:{user.id}): {count} consultations")

# Show FHIR logs
print("\n=== FHIR LOGS ===")
fhir_count = FHIRResourceLog.objects.filter(resource_type="ServiceRequest").count()
print(f"Total ServiceRequest logs: {fhir_count}")
for log in FHIRResourceLog.objects.filter(resource_type="ServiceRequest").order_by('-created_at')[:3]:
    print(f"  Log ID: {log.id}, Local ID: {log.local_object_id}, Status: {log.sync_status}")
