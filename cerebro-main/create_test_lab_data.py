#!/usr/bin/env python
"""
Script pour créer des données de test pour le système de gestion des résultats de lab
"""
import os
import sys
import django
from datetime import datetime, timedelta
import random

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cerebro.settings')
django.setup()

from accounts.models import LabResult, User, PatientProfile, DoctorProfile, Notification
from django.contrib.auth.models import User as AuthUser

def create_test_lab_results():
    """Créer des résultats de lab de test avec différents panels"""

    print("Création des données de test pour le système de lab...")

    # Récupérer ou créer des utilisateurs de test
    try:
        patient_user = User.objects.get(email='patient@test.com')
        patient_profile = PatientProfile.objects.get(user=patient_user)
    except:
        patient_user = User.objects.create_user(
            email='patient@test.com',
            password='test123',
            first_name='Jean',
            last_name='Dupont',
            role='patient'
        )
        patient_profile = PatientProfile.objects.create(
            user=patient_user,
            date_of_birth='1980-01-01',
            phone_number='+33123456789'
        )

    try:
        doctor_user = User.objects.get(email='doctor@test.com')
        doctor_profile = DoctorProfile.objects.get(user=doctor_user)
    except:
        doctor_user = User.objects.create_user(
            email='doctor@test.com',
            password='test123',
            first_name='Dr. Marie',
            last_name='Martin',
            role='doctor'
        )
        doctor_profile = DoctorProfile.objects.create(
            user=doctor_user,
            license_number='DOC123456',
            specialty='Neurology'
        )

    # Données de test pour différents panels
    test_data = [
        {
            'test_name': 'Complete Blood Count (CBC)',
            'panel_type': 'CBC',
            'components': {
                'hemoglobin': {'name': 'Hemoglobin', 'value': '14.2', 'unit': 'g/dL', 'reference_range': '12.0 - 16.0'},
                'hematocrit': {'name': 'Hematocrit', 'value': '42.1', 'unit': '%', 'reference_range': '36.0 - 46.0'},
                'wbc': {'name': 'White Blood Cells', 'value': '8.5', 'unit': '10^3/µL', 'reference_range': '4.0 - 11.0'},
                'platelets': {'name': 'Platelets', 'value': '280', 'unit': '10^3/µL', 'reference_range': '150 - 450'},
            },
            'status': 'completed',
            'is_abnormal': False,
            'critical_flag': False,
        },
        {
            'test_name': 'Metabolic Panel',
            'panel_type': 'METABOLIC',
            'components': {
                'glucose': {'name': 'Glucose', 'value': '145', 'unit': 'mg/dL', 'reference_range': '70 - 100'},
                'creatinine': {'name': 'Creatinine', 'value': '1.8', 'unit': 'mg/dL', 'reference_range': '0.6 - 1.2'},
                'bun': {'name': 'BUN', 'value': '35', 'unit': 'mg/dL', 'reference_range': '7 - 20'},
                'sodium': {'name': 'Sodium', 'value': '138', 'unit': 'mmol/L', 'reference_range': '135 - 145'},
            },
            'status': 'completed',
            'is_abnormal': True,
            'critical_flag': True,  # Créatinine élevée = critique
        },
        {
            'test_name': 'Hepatic Panel',
            'panel_type': 'HEPATIC',
            'components': {
                'alt': {'name': 'ALT', 'value': '85', 'unit': 'U/L', 'reference_range': '7 - 56'},
                'ast': {'name': 'AST', 'value': '65', 'unit': 'U/L', 'reference_range': '10 - 40'},
                'bilirubin': {'name': 'Total Bilirubin', 'value': '1.2', 'unit': 'mg/dL', 'reference_range': '0.3 - 1.2'},
                'albumin': {'name': 'Albumin', 'value': '3.8', 'unit': 'g/dL', 'reference_range': '3.5 - 5.0'},
            },
            'status': 'completed',
            'is_abnormal': True,
            'critical_flag': False,
        },
        {
            'test_name': 'Thyroid Stimulating Hormone',
            'panel_type': '',
            'result_value': '0.05',
            'result_unit': 'mIU/L',
            'reference_range': '0.27 - 4.2',
            'status': 'pending',
            'is_abnormal': True,
            'critical_flag': False,
        },
        {
            'test_name': 'Vitamin D',
            'panel_type': '',
            'result_value': '18',
            'result_unit': 'ng/mL',
            'reference_range': '30 - 100',
            'status': 'in_progress',
            'is_abnormal': True,
            'critical_flag': False,
        },
    ]

    # Créer les résultats de lab
    created_results = []
    for i, data in enumerate(test_data):
        lab_result = LabResult.objects.create(
            patient=patient_user,
            doctor=doctor_user,
            test_name=data['test_name'],
            test_code=data.get('test_code', f'TEST{i+1:03d}'),
            result_value=data.get('result_value', ''),
            result_unit=data.get('result_unit', ''),
            reference_range=data.get('reference_range', ''),
            interpretation=data.get('interpretation', ''),
            panel_type=data.get('panel_type', ''),
            components=data.get('components', {}),
            status=data.get('status', 'pending'),
            is_abnormal=data.get('is_abnormal', False),
            critical_flag=data.get('critical_flag', False),
            completed_at=datetime.now() - timedelta(days=i*2, hours=1) if data.get('status') == 'completed' else None,
        )
        created_results.append(lab_result)
        print(f"✅ Créé: {lab_result.test_name} ({lab_result.status})")

    # Créer des notifications pour les résultats critiques
    critical_results = [r for r in created_results if r.critical_flag]
    for result in critical_results:
        Notification.objects.create(
            recipient=result.patient,
            title='Résultat de laboratoire critique',
            content=f'Votre résultat {result.test_name} nécessite une attention immédiate.',
            notification_type='result',
        )
        Notification.objects.create(
            recipient=result.doctor,
            title='Valeur critique détectée',
            content=f'Valeur critique détectée pour {result.patient.get_full_name()}: {result.test_name}',
            notification_type='result',
        )
        print(f"🔔 Notifications créées pour résultat critique: {result.test_name}")

    print(f"\n🎉 Création terminée ! {len(created_results)} résultats de lab créés.")
    print("\nComptes de test :")
    print(f"  Patient: patient@test.com / test123")
    print(f"  Docteur: doctor@test.com / test123")
    print("\nURLs à tester :")
    print("  Frontend: http://localhost:5173")
    print("  Backend API: http://localhost:8000/api/auth/lab-results/")

if __name__ == '__main__':
    create_test_lab_results()