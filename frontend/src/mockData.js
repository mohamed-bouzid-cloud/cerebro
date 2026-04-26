/**
 * Mock Data Generator for Development/Testing
 * Used when FHIR server is unavailable or API calls fail
 */

// Mock Patients
export const mockPatients = [
    {
        id: 'PATIENT-001',
        user: 'PATIENT-001',
        first_name: 'Tony',
        last_name: 'Stark',
        email: 't.stark@starkindustries.com',
        age: 48,
        date_of_birth: '1970-05-29',
        phone_number: '+1-555-0001',
        blood_type: 'AB+',
        triage_score: 9,
        last_visit: '2026-04-10',
        status: 'active',
        gender: 'Male',
        avatar: '🤖'
    },
    {
        id: 'PATIENT-002',
        user: 'PATIENT-002',
        first_name: 'Steve',
        last_name: 'Rogers',
        email: 's.rogers@shield.gov',
        age: 105,
        date_of_birth: '1918-07-04',
        phone_number: '+1-555-0002',
        blood_type: 'O-',
        triage_score: 2,
        last_visit: '2026-03-15',
        status: 'active',
        gender: 'Male',
        avatar: '🛡️'
    },
    {
        id: 'PATIENT-003',
        user: 'PATIENT-003',
        first_name: 'Bruce',
        last_name: 'Banner',
        email: 'b.banner@shield.gov',
        age: 49,
        date_of_birth: '1969-12-18',
        phone_number: '+1-555-0003',
        blood_type: 'B+',
        triage_score: 8,
        last_visit: '2026-04-12',
        status: 'active',
        gender: 'Male',
        avatar: '🧪'
    },
    {
        id: 'PATIENT-004',
        user: 'PATIENT-004',
        first_name: 'Natasha',
        last_name: 'Romanoff',
        email: 'n.romanoff@shield.gov',
        age: 35,
        date_of_birth: '1984-11-22',
        phone_number: '+1-555-0004',
        blood_type: 'A+',
        triage_score: 5,
        last_visit: '2026-04-01',
        status: 'active',
        gender: 'Female',
        avatar: '🕷️'
    },
    {
        id: 'PATIENT-005',
        user: 'PATIENT-005',
        first_name: 'Thor',
        last_name: 'Odinson',
        email: 'thor@asgard.gov',
        age: 1500,
        date_of_birth: '0964-08-01',
        phone_number: '+1-555-0005',
        blood_type: 'O+',
        triage_score: 4,
        last_visit: '2026-02-28',
        status: 'active',
        gender: 'Male',
        avatar: '⚡'
    },
    {
        id: 'PATIENT-006',
        user: 'PATIENT-006',
        first_name: 'Clint',
        last_name: 'Barton',
        email: 'c.barton@shield.gov',
        age: 42,
        date_of_birth: '1971-01-07',
        phone_number: '+1-555-0006',
        blood_type: 'A-',
        triage_score: 6,
        last_visit: '2026-03-20',
        status: 'active',
        gender: 'Male',
        avatar: '🏹'
    }
];

// Mock Appointments - auto-generated based on current date
export const generateMockAppointments = () => {
    const now = new Date();
    const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return [
        {
            id: 'APT-001',
            patient: 'PATIENT-001',
            patient_name: 'John Doe',
            doctor: 'DOCTOR-001',
            doctor_name: 'Dr. Sarah Mitchell',
            doctor_specialty: 'Cardiology',
            scheduled_at: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(),
            duration_minutes: 30,
            status: 'scheduled',
            notes: 'Annual checkup - Cardiac examination',
            location: 'Main Clinic, Suite 301',
            reason: 'Annual Checkup',
            created_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            fhir_sync_status: 'synced',
            is_mock: true
        },
        {
            id: 'APT-002',
            patient: 'PATIENT-002',
            patient_name: 'Jane Smith',
            doctor: 'DOCTOR-001',
            doctor_name: 'Dr. Sarah Mitchell',
            doctor_specialty: 'Cardiology',
            scheduled_at: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString(),
            duration_minutes: 45,
            status: 'scheduled',
            notes: 'Follow-up hypertension management',
            location: 'Main Clinic, Suite 301',
            reason: 'Follow-up',
            created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            fhir_sync_status: 'synced',
            is_mock: true
        },
        {
            id: 'APT-003',
            patient: 'PATIENT-003',
            patient_name: 'Robert Johnson',
            doctor: 'DOCTOR-001',
            doctor_name: 'Dr. Sarah Mitchell',
            doctor_specialty: 'Cardiology',
            scheduled_at: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000).toISOString(),
            duration_minutes: 30,
            status: 'scheduled',
            notes: 'Chest pain evaluation',
            location: 'Main Clinic, Suite 301',
            reason: 'Chest Pain',
            created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            fhir_sync_status: 'synced',
            is_mock: true
        },
        {
            id: 'APT-004',
            patient: 'PATIENT-004',
            patient_name: 'Emily Williams',
            doctor: 'DOCTOR-001',
            doctor_name: 'Dr. Sarah Mitchell',
            doctor_specialty: 'Cardiology',
            scheduled_at: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString(),
            duration_minutes: 30,
            status: 'scheduled',
            notes: 'Diabetes management review',
            location: 'Main Clinic, Suite 301',
            reason: 'Chronic Disease Management',
            created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            fhir_sync_status: 'synced',
            is_mock: true
        },
        {
            id: 'APT-005',
            patient: 'PATIENT-005',
            patient_name: 'Michael Brown',
            doctor: 'DOCTOR-001',
            doctor_name: 'Dr. Sarah Mitchell',
            doctor_specialty: 'Cardiology',
            scheduled_at: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000).toISOString(),
            duration_minutes: 30,
            status: 'scheduled',
            notes: 'Pre-operative assessment',
            location: 'Main Clinic, Suite 301',
            reason: 'Pre-operative Assessment',
            created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            fhir_sync_status: 'synced',
            is_mock: true
        },
        {
            id: 'APT-006',
            patient: 'PATIENT-006',
            patient_name: 'Sarah Davis',
            doctor: 'DOCTOR-001',
            doctor_name: 'Dr. Sarah Mitchell',
            doctor_specialty: 'Cardiology',
            scheduled_at: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000).toISOString(),
            duration_minutes: 45,
            status: 'scheduled',
            notes: 'Diabetes management and monitoring',
            location: 'Main Clinic, Suite 302',
            reason: 'Chronic Disease Management',
            created_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            fhir_sync_status: 'synced',
            is_mock: true
        },
        {
            id: 'APT-007',
            patient: 'PATIENT-007',
            patient_name: 'David Wilson',
            doctor: 'DOCTOR-001',
            doctor_name: 'Dr. Sarah Mitchell',
            doctor_specialty: 'Cardiology',
            scheduled_at: new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(),
            duration_minutes: 30,
            status: 'scheduled',
            notes: 'Hypertension and medication review',
            location: 'Main Clinic, Suite 301',
            reason: 'Medication Review',
            created_at: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            fhir_sync_status: 'synced',
            is_mock: true
        },
        {
            id: 'APT-008',
            patient: 'PATIENT-008',
            patient_name: 'Lisa Anderson',
            doctor: 'DOCTOR-001',
            doctor_name: 'Dr. Sarah Mitchell',
            doctor_specialty: 'Cardiology',
            scheduled_at: new Date(baseDate.getTime() + 6 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000).toISOString(),
            duration_minutes: 30,
            status: 'scheduled',
            notes: 'Cardiac evaluation and stress test results review',
            location: 'Main Clinic, Suite 303',
            reason: 'Cardiac Evaluation',
            created_at: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            fhir_sync_status: 'synced',
            is_mock: true
        },
        {
            id: 'APT-009',
            patient: 'PATIENT-009',
            patient_name: 'James Martinez',
            doctor: 'DOCTOR-001',
            doctor_name: 'Dr. Sarah Mitchell',
            doctor_specialty: 'Cardiology',
            scheduled_at: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000).toISOString(),
            duration_minutes: 60,
            status: 'scheduled',
            notes: 'Comprehensive cardiovascular assessment',
            location: 'Main Clinic, Suite 304',
            reason: 'Comprehensive Assessment',
            created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            fhir_sync_status: 'synced',
            is_mock: true
        },
        {
            id: 'APT-010',
            patient: 'PATIENT-010',
            patient_name: 'Amanda Taylor',
            doctor: 'DOCTOR-001',
            doctor_name: 'Dr. Sarah Mitchell',
            doctor_specialty: 'Cardiology',
            scheduled_at: new Date(baseDate.getTime() + 8 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString(),
            duration_minutes: 30,
            status: 'scheduled',
            notes: 'Routine physical examination',
            location: 'Main Clinic, Suite 301',
            reason: 'Routine Physical',
            created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            fhir_sync_status: 'synced',
            is_mock: true
        }
    ];
};

// Mock FHIR Conditions
export const mockConditions = [
    {
        id: 'COND-001',
        resourceType: 'Condition',
        code: { coding: [{ code: 'I10', display: 'Essential (primary) hypertension' }] },
        subject: { reference: 'Patient/PATIENT-001' },
        onsetDateTime: '2020-06-15',
        clinicalStatus: { coding: [{ code: 'active' }] },
        verificationStatus: { coding: [{ code: 'confirmed' }] }
    },
    {
        id: 'COND-002',
        resourceType: 'Condition',
        code: { coding: [{ code: 'E11', display: 'Type 2 diabetes mellitus' }] },
        subject: { reference: 'Patient/PATIENT-002' },
        onsetDateTime: '2019-03-10',
        clinicalStatus: { coding: [{ code: 'active' }] },
        verificationStatus: { coding: [{ code: 'confirmed' }] }
    }
];

// Mock Medications
export const mockMedications = [
    {
        id: 'MED-001',
        resourceType: 'MedicationRequest',
        medicationCodeableConcept: { coding: [{ code: 'LISINOPRIL', display: 'Lisinopril 10mg' }] },
        subject: { reference: 'Patient/PATIENT-001' },
        status: 'active',
        intent: 'order',
        dosageInstruction: [{ text: 'Take 1 tablet daily in the morning' }]
    },
    {
        id: 'MED-002',
        resourceType: 'MedicationRequest',
        medicationCodeableConcept: { coding: [{ code: 'METFORMIN', display: 'Metformin 1000mg' }] },
        subject: { reference: 'Patient/PATIENT-002' },
        status: 'active',
        intent: 'order',
        dosageInstruction: [{ text: 'Take 1 tablet twice daily with meals' }]
    }
];

// Mock Allergies
export const mockAllergies = [
    {
        id: 'ALLERGY-001',
        resourceType: 'AllergyIntolerance',
        code: { coding: [{ code: 'PENICILLIN', display: 'Penicillin' }] },
        patient: { reference: 'Patient/PATIENT-001' },
        reaction: [{ manifestation: [{ coding: [{ display: 'Rash' }] }] }],
        criticality: 'high'
    },
    {
        id: 'ALLERGY-002',
        resourceType: 'AllergyIntolerance',
        code: { coding: [{ code: 'SULFA', display: 'Sulfonamides' }] },
        patient: { reference: 'Patient/PATIENT-003' },
        reaction: [{ manifestation: [{ coding: [{ display: 'Nausea' }] }] }],
        criticality: 'medium'
    }
];

// Mock Vital Signs
export const mockVitals = [
    {
        id: 'VITAL-001',
        resourceType: 'Observation',
        code: { coding: [{ code: 'BP', display: 'Blood Pressure' }] },
        subject: { reference: 'Patient/PATIENT-001' },
        effectiveDateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        valueString: '138/88 mmHg'
    },
    {
        id: 'VITAL-002',
        resourceType: 'Observation',
        code: { coding: [{ code: 'HR', display: 'Heart Rate' }] },
        subject: { reference: 'Patient/PATIENT-001' },
        effectiveDateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        valueQuantity: { value: 72, unit: 'beats/min' }
    },
    {
        id: 'VITAL-003',
        resourceType: 'Observation',
        code: { coding: [{ code: 'TEMP', display: 'Body Temperature' }] },
        subject: { reference: 'Patient/PATIENT-001' },
        effectiveDateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        valueQuantity: { value: 36.8, unit: '°C' }
    },
    {
        id: 'VITAL-004',
        resourceType: 'Observation',
        code: { coding: [{ code: 'SPO2', display: 'Oxygen Saturation' }] },
        subject: { reference: 'Patient/PATIENT-001' },
        effectiveDateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        valueQuantity: { value: 98, unit: '%' }
    },
    {
        id: 'VITAL-005',
        resourceType: 'Observation',
        code: { coding: [{ code: 'HR', display: 'Heart Rate' }] },
        subject: { reference: 'Patient/PATIENT-002' },
        effectiveDateTime: new Date().toISOString(),
        valueQuantity: { value: 68, unit: 'beats/min' }
    },
    {
        id: 'VITAL-006',
        resourceType: 'Observation',
        code: { coding: [{ code: 'BP', display: 'Blood Pressure' }] },
        subject: { reference: 'Patient/PATIENT-002' },
        effectiveDateTime: new Date().toISOString(),
        valueString: '120/80 mmHg'
    },
    {
        id: 'VITAL-007',
        resourceType: 'Observation',
        code: { coding: [{ code: 'TEMP', display: 'Body Temperature' }] },
        subject: { reference: 'Patient/PATIENT-002' },
        effectiveDateTime: new Date().toISOString(),
        valueQuantity: { value: 37.1, unit: '°C' }
    },
    {
        id: 'VITAL-008',
        resourceType: 'Observation',
        code: { coding: [{ code: 'SPO2', display: 'Oxygen Saturation' }] },
        subject: { reference: 'Patient/PATIENT-002' },
        effectiveDateTime: new Date().toISOString(),
        valueQuantity: { value: 99, unit: '%' }
    },
    {
        id: 'VITAL-009',
        resourceType: 'Observation',
        code: { coding: [{ code: 'HR', display: 'Heart Rate' }] },
        subject: { reference: 'Patient/PATIENT-003' },
        effectiveDateTime: new Date().toISOString(),
        valueQuantity: { value: 110, unit: 'beats/min' }
    },
    {
        id: 'VITAL-010',
        resourceType: 'Observation',
        code: { coding: [{ code: 'BP', display: 'Blood Pressure' }] },
        subject: { reference: 'Patient/PATIENT-003' },
        effectiveDateTime: new Date().toISOString(),
        valueString: '150/95 mmHg'
    },
    {
        id: 'VITAL-011',
        resourceType: 'Observation',
        code: { coding: [{ code: 'TEMP', display: 'Body Temperature' }] },
        subject: { reference: 'Patient/PATIENT-003' },
        effectiveDateTime: new Date().toISOString(),
        valueQuantity: { value: 38.5, unit: '°C' }
    },
    {
        id: 'VITAL-012',
        resourceType: 'Observation',
        code: { coding: [{ code: 'SPO2', display: 'Oxygen Saturation' }] },
        subject: { reference: 'Patient/PATIENT-003' },
        effectiveDateTime: new Date().toISOString(),
        valueQuantity: { value: 92, unit: '%' }
    }
];

// Simulate FHIR bundle response
export const generateMockFHIRBundle = (patientId) => {
    const patientData = mockPatients.find(p => p.id === patientId) || mockPatients[0];
    
    // Generate a set of dynamic vitals if they don't exist
    const dynamicVitals = [
        {
            resource: {
                resourceType: 'Observation',
                id: `VITAL-HR-${patientId}`,
                code: { coding: [{ code: 'HR', display: 'Heart Rate' }] },
                subject: { reference: `Patient/${patientId}` },
                valueQuantity: { value: 65 + Math.floor(Math.random() * 20), unit: 'beats/min' }
            }
        },
        {
            resource: {
                resourceType: 'Observation',
                id: `VITAL-BP-${patientId}`,
                code: { coding: [{ code: 'BP', display: 'Blood Pressure' }] },
                subject: { reference: `Patient/${patientId}` },
                valueString: `${110 + Math.floor(Math.random() * 30)}/${70 + Math.floor(Math.random() * 20)} mmHg`
            }
        },
        {
            resource: {
                resourceType: 'Observation',
                id: `VITAL-TEMP-${patientId}`,
                code: { coding: [{ code: 'TEMP', display: 'Body Temperature' }] },
                subject: { reference: `Patient/${patientId}` },
                valueQuantity: { value: (36.5 + Math.random() * 1.5).toFixed(1), unit: '°C' }
            }
        },
        {
            resource: {
                resourceType: 'Observation',
                id: `VITAL-SPO2-${patientId}`,
                code: { coding: [{ code: 'SPO2', display: 'Oxygen Saturation' }] },
                subject: { reference: `Patient/${patientId}` },
                valueQuantity: { value: 95 + Math.floor(Math.random() * 5), unit: '%' }
            }
        }
    ];

    return {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
            {
                resource: {
                    resourceType: 'Patient',
                    id: patientData.id,
                    name: [{ given: [patientData.first_name], family: patientData.last_name }],
                    birthDate: patientData.date_of_birth,
                    telecom: [{ system: 'email', value: patientData.email }],
                    contact: [{ telecom: [{ system: 'phone', value: patientData.phone_number }] }]
                }
            },
            ...mockConditions.filter(c => c.subject.reference.includes(patientId))
                .map(cond => ({ resource: cond })),
            ...mockMedications.filter(m => m.subject.reference.includes(patientId))
                .map(med => ({ resource: med })),
            ...mockAllergies.filter(a => a.patient.reference.includes(patientId))
                .map(allergy => ({ resource: allergy })),
            ...dynamicVitals,
            ...mockVitals.filter(v => v.subject.reference.includes(patientId))
                .map(vital => ({ resource: vital }))
        ]
    };
};

// Mock Triage Scores
export const generateMockTriageScores = () => {
    const now = new Date();
    return [
        {
            id: 'TRIAGE-001',
            patient: 'PATIENT-001',
            patient_name: 'John Doe',
            doctor: 'DOCTOR-001',
            doctor_name: 'Dr. Sarah Mitchell',
            chief_complaint: 'Chest pain and shortness of breath',
            chief_complaint_score: 9,
            vital_signs_score: 8,
            mental_status_score: 7,
            pain_level: 8,
            overall_score: 32,
            urgency_level: 3,
            urgency_label: 'Urgent',
            assessment_notes: 'Patient presents with acute chest pain radiating to left arm with dyspnea. Vital signs elevated. Requires immediate ECG and cardiac workup.',
            created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
            is_mock: true
        },
        {
            id: 'TRIAGE-002',
            patient: 'PATIENT-003',
            patient_name: 'Robert Johnson',
            doctor: 'DOCTOR-001',
            doctor_name: 'Dr. Sarah Mitchell',
            chief_complaint: 'Severe abdominal pain and vomiting',
            chief_complaint_score: 10,
            vital_signs_score: 9,
            mental_status_score: 6,
            pain_level: 10,
            overall_score: 35,
            urgency_level: 2,
            urgency_label: 'Emergency',
            assessment_notes: 'Patient in acute distress with severe abdominal pain. Signs of acute abdomen. Recommend immediate CT abdomen.',
            created_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
            is_mock: true
        },
        {
            id: 'TRIAGE-003',
            patient: 'PATIENT-002',
            patient_name: 'Jane Smith',
            doctor: 'DOCTOR-001',
            doctor_name: 'Dr. Sarah Mitchell',
            chief_complaint: 'Routine follow-up for hypertension',
            chief_complaint_score: 3,
            vital_signs_score: 4,
            mental_status_score: 5,
            pain_level: 1,
            overall_score: 13,
            urgency_level: 5,
            urgency_label: 'Non-urgent',
            assessment_notes: 'Patient stable on current antihypertensive regimen. BP well-controlled at 132/84.',
            created_at: now.toISOString(),
            is_mock: true
        },
        {
            id: 'TRIAGE-004',
            patient: 'PATIENT-006',
            patient_name: 'Sarah Davis',
            doctor: 'DOCTOR-001',
            doctor_name: 'Dr. Sarah Mitchell',
            chief_complaint: 'Diabetes management follow-up',
            chief_complaint_score: 4,
            vital_signs_score: 5,
            mental_status_score: 5,
            pain_level: 2,
            overall_score: 16,
            urgency_level: 4,
            urgency_label: 'Semi-urgent',
            assessment_notes: 'Patient reports good glycemic control. Recent HbA1c 6.8%. Continue current regimen.',
            created_at: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
            is_mock: true
        },
        {
            id: 'TRIAGE-005',
            patient: 'PATIENT-008',
            patient_name: 'Lisa Anderson',
            doctor: 'DOCTOR-001',
            doctor_name: 'Dr. Sarah Mitchell',
            chief_complaint: 'Palpitations and dyspnea on exertion',
            chief_complaint_score: 8,
            vital_signs_score: 7,
            mental_status_score: 6,
            pain_level: 5,
            overall_score: 26,
            urgency_level: 3,
            urgency_label: 'Urgent',
            assessment_notes: 'Patient reports episodes of palpitations with exertion. Requires cardiac workup and stress testing.',
            created_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
            is_mock: true
        },
        {
            id: 'TRIAGE-006',
            patient: 'PATIENT-009',
            patient_name: 'James Martinez',
            doctor: 'DOCTOR-001',
            doctor_name: 'Dr. Sarah Mitchell',
            chief_complaint: 'Chest pain at rest and mild confusion',
            chief_complaint_score: 10,
            vital_signs_score: 9,
            mental_status_score: 8,
            pain_level: 9,
            overall_score: 36,
            urgency_level: 2,
            urgency_label: 'Emergency',
            assessment_notes: 'Elderly patient with acute chest pain and altered mental status. Immediate hospitalization recommended. Possible MI or stroke.',
            created_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
            is_mock: true
        }
    ];
};

// Mock Consultation Notes
export const generateMockConsultationNotes = () => {
    const now = new Date();
    return [
        {
            id: 'NOTE-001',
            appointment: 'APT-001',
            patient: 'PATIENT-001',
            patient_name: 'John Doe',
            doctor: 'DOCTOR-001',
            doctor_name: 'Dr. Sarah Mitchell',
            note_type: 'assessment',
            title: 'Cardiac Assessment - Initial Visit',
            content: 'Patient presents with history of hypertension and family history of coronary artery disease. Currently on Lisinopril 10mg daily. Denies chest pain at rest but reports SOB on exertion.',
            vital_signs: {
                blood_pressure: '140/90',
                heart_rate: 78,
                temperature: 36.8,
                respiratory_rate: 16,
                oxygen_saturation: 98
            },
            medications_reviewed: ['Lisinopril 10mg daily', 'Aspirin 81mg daily'],
            allergies_noted: ['Penicillin'],
            created_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            is_mock: true
        },
        {
            id: 'NOTE-002',
            appointment: 'APT-002',
            patient: 'PATIENT-002',
            patient_name: 'Jane Smith',
            doctor: 'DOCTOR-001',
            doctor_name: 'Dr. Sarah Mitchell',
            note_type: 'follow-up',
            title: 'Hypertension Follow-up',
            content: 'Patient reports good medication compliance. No side effects reported. Lifestyle modifications maintained (low-sodium diet, regular exercise).',
            vital_signs: {
                blood_pressure: '132/84',
                heart_rate: 72,
                temperature: 36.9,
                respiratory_rate: 15,
                oxygen_saturation: 99
            },
            medications_reviewed: ['Metoprolol 50mg daily', 'Hydrochlorothiazide 25mg daily'],
            allergies_noted: ['Sulfa drugs'],
            created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            is_mock: true
        },
        {
            id: 'NOTE-003',
            appointment: 'APT-006',
            patient: 'PATIENT-006',
            patient_name: 'Sarah Davis',
            doctor: 'DOCTOR-001',
            doctor_name: 'Dr. Sarah Mitchell',
            note_type: 'assessment',
            title: 'Diabetes Management Assessment',
            content: 'Patient with Type 2 DM well-controlled on current regimen. Recent lab work shows HbA1c 6.8%. Patient adhering to diet and exercise program. No signs of diabetic complications.',
            vital_signs: {
                blood_pressure: '128/80',
                heart_rate: 70,
                temperature: 37.0,
                respiratory_rate: 16,
                oxygen_saturation: 98
            },
            medications_reviewed: ['Metformin 1000mg twice daily', 'Glipizide 10mg daily'],
            allergies_noted: ['NKDA'],
            created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            is_mock: true
        },
        {
            id: 'NOTE-004',
            appointment: 'APT-008',
            patient: 'PATIENT-008',
            patient_name: 'Lisa Anderson',
            doctor: 'DOCTOR-001',
            doctor_name: 'Dr. Sarah Mitchell',
            note_type: 'follow-up',
            title: 'Cardiac Palpitations Evaluation',
            content: 'Patient reports episodes of palpitations with exertion for past 2 weeks. No syncope or severe SOB. ECG performed shows normal sinus rhythm. Recommend stress testing and 24-hour Holter monitor.',
            vital_signs: {
                blood_pressure: '135/85',
                heart_rate: 76,
                temperature: 36.8,
                respiratory_rate: 17,
                oxygen_saturation: 98
            },
            medications_reviewed: ['Lisinopril 10mg daily'],
            allergies_noted: ['Penicillin'],
            created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            is_mock: true
        }
    ];
};

// Mock Prescriptions
export const generateMockPrescriptions = () => {
    const now = new Date();
    return [
        {
            id: 'RX-001',
            patient: 'PATIENT-001',
            patient_name: 'John Doe',
            doctor: 'DOCTOR-001',
            doctor_name: 'Dr. Sarah Mitchell',
            medication_name: 'Atorvastatin',
            dosage: '40mg',
            route: 'Oral',
            frequency: 'Once daily at bedtime',
            duration_days: 90,
            quantity: 90,
            refills: 3,
            status: 'active',
            indication: 'Hyperlipidemia management',
            issued_at: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            expires_at: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(),
            is_mock: true
        },
        {
            id: 'RX-002',
            patient: 'PATIENT-002',
            patient_name: 'Jane Smith',
            doctor: 'DOCTOR-001',
            doctor_name: 'Dr. Sarah Mitchell',
            medication_name: 'Metformin',
            dosage: '1000mg',
            route: 'Oral',
            frequency: 'Twice daily with meals',
            duration_days: 180,
            quantity: 180,
            refills: 6,
            status: 'active',
            indication: 'Type 2 Diabetes Mellitus',
            issued_at: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            expires_at: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString(),
            is_mock: true
        },
        {
            id: 'RX-003',
            patient: 'PATIENT-006',
            patient_name: 'Sarah Davis',
            doctor: 'DOCTOR-001',
            doctor_name: 'Dr. Sarah Mitchell',
            medication_name: 'Gliclazide',
            dosage: '80mg',
            route: 'Oral',
            frequency: 'Once daily with breakfast',
            duration_days: 90,
            quantity: 90,
            refills: 3,
            status: 'active',
            indication: 'Type 2 Diabetes Management',
            issued_at: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
            expires_at: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString(),
            is_mock: true
        },
        {
            id: 'RX-004',
            patient: 'PATIENT-008',
            patient_name: 'Lisa Anderson',
            doctor: 'DOCTOR-001',
            doctor_name: 'Dr. Sarah Mitchell',
            medication_name: 'Propranolol',
            dosage: '40mg',
            route: 'Oral',
            frequency: 'Twice daily',
            duration_days: 60,
            quantity: 60,
            refills: 2,
            status: 'active',
            indication: 'Palpitations and cardiac arrhythmia',
            issued_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            expires_at: new Date(now.getTime() + 53 * 24 * 60 * 60 * 1000).toISOString(),
            is_mock: true
        },
        {
            id: 'RX-005',
            patient: 'PATIENT-009',
            patient_name: 'James Martinez',
            doctor: 'DOCTOR-001',
            doctor_name: 'Dr. Sarah Mitchell',
            medication_name: 'Aspirin',
            dosage: '325mg',
            route: 'Oral',
            frequency: 'Once daily',
            duration_days: 180,
            quantity: 180,
            refills: 5,
            status: 'active',
            indication: 'Cardiovascular protection and antiplatelet therapy',
            issued_at: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            expires_at: new Date(now.getTime() + 150 * 24 * 60 * 60 * 1000).toISOString(),
            is_mock: true
        }
    ];
};

// Mock Timeline Events
export const generateMockTimelineEvents = () => {
    const now = new Date();
    return [
        {
            id: 'EVENT-001',
            patient: 'PATIENT-001',
            event_type: 'appointment',
            event_date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            title: 'Cardiology Consultation',
            description: 'Initial cardiac assessment with Dr. Sarah Mitchell',
            related_object_type: 'Appointment',
            related_object_id: 'APT-001',
            is_critical: false,
            created_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'EVENT-002',
            patient: 'PATIENT-001',
            event_type: 'lab_result',
            event_date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            title: 'Lipid Panel Results',
            description: 'Total Cholesterol: 245 mg/dL, LDL: 165 mg/dL, HDL: 35 mg/dL',
            related_object_type: 'DiagnosticReport',
            related_object_id: 'LAB-001',
            is_critical: true,
            created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'EVENT-003',
            patient: 'PATIENT-001',
            event_type: 'prescription',
            event_date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            title: 'Atorvastatin Prescribed',
            description: '40mg once daily for hyperlipidemia management',
            related_object_type: 'Prescription',
            related_object_id: 'RX-001',
            is_critical: false,
            created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'EVENT-004',
            patient: 'PATIENT-001',
            event_type: 'note',
            event_date: now.toISOString(),
            title: 'Consultation Note Added',
            description: 'Follow-up assessment and medication review completed',
            related_object_type: 'ConsultationNote',
            related_object_id: 'NOTE-001',
            is_critical: false,
            created_at: now.toISOString()
        },
        {
            id: 'EVENT-005',
            patient: 'PATIENT-006',
            event_type: 'appointment',
            event_date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            title: 'Diabetes Clinic Visit',
            description: 'Follow-up appointment with Dr. Sarah Mitchell for diabetes management',
            related_object_type: 'Appointment',
            related_object_id: 'APT-006',
            is_critical: false,
            created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'EVENT-006',
            patient: 'PATIENT-006',
            event_type: 'lab_result',
            event_date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            title: 'HbA1c Test Results',
            description: 'HbA1c: 6.8% (Well-controlled diabetes)',
            related_object_type: 'DiagnosticReport',
            related_object_id: 'LAB-002',
            is_critical: false,
            created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'EVENT-007',
            patient: 'PATIENT-008',
            event_type: 'appointment',
            event_date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            title: 'Cardiac Workup',
            description: 'Evaluation for palpitations and dyspnea',
            related_object_type: 'Appointment',
            related_object_id: 'APT-008',
            is_critical: false,
            created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'EVENT-008',
            patient: 'PATIENT-008',
            event_type: 'diagnostic_test',
            event_date: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            title: 'ECG Performed',
            description: 'Electrocardiogram: Normal sinus rhythm, no acute findings',
            related_object_type: 'DiagnosticReport',
            related_object_id: 'LAB-003',
            is_critical: false,
            created_at: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'EVENT-009',
            patient: 'PATIENT-009',
            event_type: 'appointment',
            event_date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            title: 'Emergency Cardiac Assessment',
            description: 'Comprehensive cardiovascular evaluation',
            related_object_type: 'Appointment',
            related_object_id: 'APT-009',
            is_critical: true,
            created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'EVENT-010',
            patient: 'PATIENT-009',
            event_type: 'admission',
            event_date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            title: 'Hospital Admission',
            description: 'Admitted for acute chest pain evaluation and cardiac workup',
            related_object_type: 'Appointment',
            related_object_id: 'APT-009',
            is_critical: true,
            created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];
};

// Mock Consultation Requests (Incoming)
export const generateMockConsultationRequests = () => {
    const now = new Date();
    return [
        {
            id: 'CONSULT-001',
            patient: 'PATIENT-003',
            patient_name: 'Robert Johnson',
            doctor: 'DOCTOR-001',
            doctor_name: 'Dr. Sarah Mitchell',
            consultation_type: 'Cardiology',
            status: 'proposed',
            reason: 'Persistent chest pain radiating to left arm, worsening with exertion. ECG review requested.',
            duration_minutes: 45,
            created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
            is_mock: true
        },
        {
            id: 'CONSULT-002',
            patient: 'PATIENT-005',
            patient_name: 'Michael Brown',
            doctor: 'DOCTOR-001',
            doctor_name: 'Dr. Sarah Mitchell',
            consultation_type: 'Pre-operative',
            status: 'requested',
            reason: 'Pre-operative cardiac clearance needed for elective knee replacement surgery.',
            duration_minutes: 30,
            created_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
            is_mock: true
        },
        {
            id: 'CONSULT-003',
            patient: 'PATIENT-009',
            patient_name: 'James Martinez',
            doctor: 'DOCTOR-001',
            doctor_name: 'Dr. Sarah Mitchell',
            consultation_type: 'Emergency',
            status: 'proposed',
            reason: 'Elderly patient with acute onset confusion and hypotension. Needs urgent cardiovascular assessment.',
            duration_minutes: 60,
            created_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
            is_mock: true
        },
        {
            id: 'CONSULT-004',
            patient: 'PATIENT-007',
            patient_name: 'David Wilson',
            doctor: 'DOCTOR-001',
            doctor_name: 'Dr. Sarah Mitchell',
            consultation_type: 'Follow-up',
            status: 'requested',
            reason: 'Blood pressure readings consistently above 160/100 despite current medication. Needs treatment adjustment.',
            duration_minutes: 30,
            created_at: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
            is_mock: true
        }
    ];
};

export default {
    mockPatients,
    generateMockAppointments,
    mockConditions,
    mockMedications,
    mockAllergies,
    mockVitals,
    generateMockFHIRBundle,
    generateMockTriageScores,
    generateMockConsultationNotes,
    generateMockPrescriptions,
    generateMockTimelineEvents,
    generateMockConsultationRequests
};
