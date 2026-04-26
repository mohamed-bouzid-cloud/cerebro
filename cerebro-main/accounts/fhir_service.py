"""
FHIR Server Integration Service
Handles all interactions with FHIR R4 compliant servers.
"""
import requests
import logging
from datetime import datetime
from django.conf import settings
from typing import Dict, Optional, Tuple

logger = logging.getLogger(__name__)


class FHIRServerError(Exception):
    """Exception raised for FHIR server communication errors."""
    pass


class FHIRService:
    """
    Service class for interacting with a FHIR R4 server.
    
    Configuration via Django settings:
    - FHIR_SERVER_URL: Base URL of FHIR server (e.g., 'http://localhost:8080/fhir')
    - FHIR_SERVER_AUTH_TOKEN: Bearer token for authentication (optional)
    """
    
    def __init__(self):
        self.server_url = getattr(settings, 'FHIR_SERVER_URL', None)
        self.auth_token = getattr(settings, 'FHIR_SERVER_AUTH_TOKEN', None)
        self.timeout = getattr(settings, 'FHIR_SERVER_TIMEOUT', 30)
        
        if not self.server_url:
            logger.warning("FHIR_SERVER_URL not configured. FHIR operations will be unavailable.")
    
    def _get_headers(self) -> Dict[str, str]:
        """Build request headers with authentication."""
        headers = {
            'Content-Type': 'application/fhir+json',
            'Accept': 'application/fhir+json',
        }
        if self.auth_token:
            headers['Authorization'] = f'Bearer {self.auth_token}'
        return headers
    
    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                     params: Optional[Dict] = None) -> Tuple[bool, Dict]:
        """
        Make HTTP request to FHIR server.
        
        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            endpoint: API endpoint (e.g., '/Patient/123' or '/Appointment')
            data: Request body (for POST/PUT)
            params: Query parameters
            
        Returns:
            Tuple of (success: bool, response_data: dict)
        """
        if not self.server_url:
            logger.error("FHIR server not configured")
            return False, {"error": "FHIR server not configured"}
        
        url = f"{self.server_url.rstrip('/')}{endpoint}"
        headers = self._get_headers()
        
        try:
            if method == 'GET':
                resp = requests.get(url, headers=headers, params=params, timeout=self.timeout)
            elif method == 'POST':
                resp = requests.post(url, headers=headers, json=data, params=params, timeout=self.timeout)
            elif method == 'PUT':
                resp = requests.put(url, headers=headers, json=data, params=params, timeout=self.timeout)
            elif method == 'DELETE':
                resp = requests.delete(url, headers=headers, params=params, timeout=self.timeout)
            else:
                return False, {"error": f"Unsupported method: {method}"}
            
            # Log request details
            logger.debug(f"FHIR Request: {method} {endpoint} - Status: {resp.status_code}")
            
            if resp.status_code in [200, 201]:
                return True, resp.json() if resp.text else {}
            elif resp.status_code == 204:
                return True, {}
            else:
                error_msg = resp.text if resp.text else f"HTTP {resp.status_code}"
                logger.error(f"FHIR Error ({resp.status_code}): {error_msg}")
                return False, {"error": error_msg, "status_code": resp.status_code}
                
        except requests.exceptions.Timeout:
            logger.error(f"FHIR request timeout: {url}")
            return False, {"error": "FHIR server timeout"}
        except requests.exceptions.RequestException as e:
            logger.error(f"FHIR request failed: {str(e)}")
            return False, {"error": str(e)}
    
    # ─────────────────────────────────────────────────────────────
    #  Patient Resource Operations
    # ─────────────────────────────────────────────────────────────
    
    def create_patient(self, user_obj) -> Tuple[bool, str, Dict]:
        """
        Create or update a FHIR Patient resource from Django User.
        
        Args:
            user_obj: Django User instance
            
        Returns:
            Tuple of (success: bool, fhir_id: str, response: dict)
        """
        from .models import PatientProfile
        
        try:
            patient_profile = user_obj.patient_profile
        except PatientProfile.DoesNotExist:
            patient_profile = PatientProfile.objects.create(user=user_obj)
        
        # Build FHIR Patient resource
        fhir_patient = {
            "resourceType": "Patient",
            "identifier": [
                {
                    "system": "urn:example:mrn",
                    "value": f"MRN{user_obj.id:06d}"
                }
            ],
            "name": [
                {
                    "use": "official",
                    "given": [user_obj.first_name] if user_obj.first_name else ["Patient"],
                    "family": user_obj.last_name if user_obj.last_name else "Unknown"
                }
            ],
            "telecom": [
                {
                    "system": "email",
                    "value": user_obj.email
                }
            ],
        }
        
        # Add optional fields
        if patient_profile.date_of_birth:
            fhir_patient["birthDate"] = str(patient_profile.date_of_birth)
        
        if patient_profile.phone_number:
            fhir_patient["telecom"].append({
                "system": "phone",
                "value": patient_profile.phone_number
            })
        
        if patient_profile.blood_type:
            fhir_patient["extension"] = [
                {
                    "url": "http://hl7.org/fhir/StructureDefinition/patient-birthPlace",
                    "valueString": f"Blood Type: {patient_profile.blood_type}"
                }
            ]
        
        # Create or update on FHIR server
        success, response = self._make_request('POST', '/Patient', data=fhir_patient)
        
        if success:
            fhir_id = response.get('id') or str(user_obj.id)
            logger.info(f"Patient created/updated on FHIR server: {fhir_id}")
            return True, fhir_id, response
        else:
            logger.error(f"Failed to create patient on FHIR server: {response}")
            return False, "", response
    
    def get_patient(self, fhir_id: str) -> Tuple[bool, Dict]:
        """Retrieve FHIR Patient resource."""
        success, response = self._make_request('GET', f'/Patient/{fhir_id}')
        return success, response
    
    # ─────────────────────────────────────────────────────────────
    #  Practitioner Resource Operations
    # ─────────────────────────────────────────────────────────────
    
    def create_practitioner(self, user_obj) -> Tuple[bool, str, Dict]:
        """
        Create or update a FHIR Practitioner resource from Django User (Doctor).
        
        Args:
            user_obj: Django User instance (role='doctor')
            
        Returns:
            Tuple of (success: bool, fhir_id: str, response: dict)
        """
        from .models import DoctorProfile
        
        if user_obj.role != "doctor":
            return False, "", {"error": "User is not a doctor"}
        
        try:
            doctor_profile = user_obj.doctor_profile
        except DoctorProfile.DoesNotExist:
            doctor_profile = DoctorProfile.objects.create(user=user_obj)
        
        # Build FHIR Practitioner resource
        fhir_practitioner = {
            "resourceType": "Practitioner",
            "identifier": [
                {
                    "system": "urn:example:npi",
                    "value": f"NPI{user_obj.id:09d}"
                }
            ],
            "name": [
                {
                    "use": "official",
                    "given": [user_obj.first_name] if user_obj.first_name else ["Dr"],
                    "family": user_obj.last_name if user_obj.last_name else "Unknown",
                    "prefix": ["Dr."]
                }
            ],
            "telecom": [
                {
                    "system": "email",
                    "value": user_obj.email
                }
            ],
        }
        
        # Add qualification (specialty)
        if doctor_profile.specialty:
            fhir_practitioner["qualification"] = [
                {
                    "code": {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/v2-0360",
                                "code": "MD",
                                "display": "Medical Doctor"
                            }
                        ],
                        "text": doctor_profile.specialty
                    }
                }
            ]
        
        if doctor_profile.license_number:
            if "identifier" not in fhir_practitioner:
                fhir_practitioner["identifier"] = []
            fhir_practitioner["identifier"].append({
                "system": "urn:example:license",
                "value": doctor_profile.license_number
            })
        
        # Create or update on FHIR server
        success, response = self._make_request('POST', '/Practitioner', data=fhir_practitioner)
        
        if success:
            fhir_id = response.get('id') or str(user_obj.id)
            logger.info(f"Practitioner created/updated on FHIR server: {fhir_id}")
            return True, fhir_id, response
        else:
            logger.error(f"Failed to create practitioner on FHIR server: {response}")
            return False, "", response
    
    def get_practitioner(self, fhir_id: str) -> Tuple[bool, Dict]:
        """Retrieve FHIR Practitioner resource."""
        success, response = self._make_request('GET', f'/Practitioner/{fhir_id}')
        return success, response
    
    # ─────────────────────────────────────────────────────────────
    #  Appointment Resource Operations (MAIN FEATURE)
    # ─────────────────────────────────────────────────────────────
    
    def create_appointment(self, appointment_obj) -> Tuple[bool, str, Dict]:
        """
        Create a FHIR Appointment resource from Django Appointment.
        This is the KEY method for syncing appointments to FHIR server.
        
        Args:
            appointment_obj: Django Appointment instance
            
        Returns:
            Tuple of (success: bool, fhir_id: str, response: dict)
        """
        # Ensure Patient and Practitioner exist on FHIR server
        patient_success, patient_fhir_id, _ = self.create_patient(appointment_obj.patient)
        doctor_success, doctor_fhir_id, _ = self.create_practitioner(appointment_obj.doctor)
        
        if not (patient_success and doctor_success):
            return False, "", {"error": "Failed to create Patient/Practitioner on FHIR server"}
        
        # Map appointment status to FHIR Appointment status
        status_map = {
            "scheduled": "booked",
            "completed": "fulfilled",
            "cancelled": "cancelled",
        }
        fhir_status = status_map.get(appointment_obj.status, "booked")
        
        # Build FHIR Appointment resource
        fhir_appointment = {
            "resourceType": "Appointment",
            "status": fhir_status,
            "appointmentType": {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/v2-0276",
                        "code": "ROUTINE",
                        "display": "Routine appointment"
                    }
                ]
            },
            "serviceType": [
                {
                    "coding": [
                        {
                            "system": "http://snomed.info/sct",
                            "code": "11429006",
                            "display": "Consultation"
                        }
                    ]
                }
            ],
            "start": appointment_obj.scheduled_at.isoformat(),
            "end": (appointment_obj.scheduled_at + 
                   __import__('datetime').timedelta(minutes=appointment_obj.duration_minutes)).isoformat(),
            "comment": appointment_obj.notes or "Appointment scheduled via Cerebro",
            "participant": [
                {
                    "actor": {
                        "reference": f"Patient/{patient_fhir_id}",
                        "type": "Patient"
                    },
                    "required": "required",
                    "status": "accepted"
                },
                {
                    "actor": {
                        "reference": f"Practitioner/{doctor_fhir_id}",
                        "type": "Practitioner"
                    },
                    "required": "required",
                    "status": "accepted"
                }
            ]
        }
        
        # Create on FHIR server
        success, response = self._make_request('POST', '/Appointment', data=fhir_appointment)
        
        if success:
            fhir_id = response.get('id') or str(appointment_obj.id)
            logger.info(f"Appointment created on FHIR server: {fhir_id}")
            return True, fhir_id, response
        else:
            logger.error(f"Failed to create appointment on FHIR server: {response}")
            return False, "", response
    
    def get_appointment(self, fhir_id: str) -> Tuple[bool, Dict]:
        """Retrieve a FHIR Appointment resource by ID."""
        success, response = self._make_request('GET', f'/Appointment/{fhir_id}')
        return success, response
    
    def search_appointments_for_practitioner(self, practitioner_fhir_id: str) -> Tuple[bool, list]:
        """
        Search for appointments involving a specific practitioner.
        This is used by doctors to fetch their appointments from FHIR server.
        
        Args:
            practitioner_fhir_id: FHIR ID of the practitioner
            
        Returns:
            Tuple of (success: bool, appointments: list of dicts)
        """
        params = {
            'actor': f'Practitioner/{practitioner_fhir_id}',
            '_sort': '-start'  # Sort by start time, newest first
        }
        success, response = self._make_request('GET', '/Appointment', params=params)
        
        if success:
            entries = response.get('entry', [])
            appointments = [entry.get('resource', {}) for entry in entries]
            logger.info(f"Retrieved {len(appointments)} appointments for practitioner {practitioner_fhir_id}")
            return True, appointments
        else:
            logger.error(f"Failed to search appointments: {response}")
            return False, []
    
    def search_appointments_for_patient(self, patient_fhir_id: str) -> Tuple[bool, list]:
        """
        Search for appointments involving a specific patient.
        
        Args:
            patient_fhir_id: FHIR ID of the patient
            
        Returns:
            Tuple of (success: bool, appointments: list of dicts)
        """
        params = {
            'actor': f'Patient/{patient_fhir_id}',
            '_sort': '-start'
        }
        success, response = self._make_request('GET', '/Appointment', params=params)
        
        if success:
            entries = response.get('entry', [])
            appointments = [entry.get('resource', {}) for entry in entries]
            logger.info(f"Retrieved {len(appointments)} appointments for patient {patient_fhir_id}")
            return True, appointments
        else:
            logger.error(f"Failed to search appointments: {response}")
            return False, []
    
    def update_appointment(self, fhir_id: str, status: str) -> Tuple[bool, Dict]:
        """
        Update an appointment's status on the FHIR server.
        
        Args:
            fhir_id: FHIR ID of the appointment
            status: New status (booked, fulfilled, cancelled, etc.)
            
        Returns:
            Tuple of (success: bool, response: dict)
        """
        # First get the current appointment
        success, current = self.get_appointment(fhir_id)
        if not success:
            return False, {"error": "Appointment not found"}
        
        # Update the status
        current['status'] = status
        success, response = self._make_request('PUT', f'/Appointment/{fhir_id}', data=current)
        
        if success:
            logger.info(f"Appointment {fhir_id} updated to status: {status}")
        else:
            logger.error(f"Failed to update appointment status: {response}")
        
        return success, response
    
    def delete_appointment(self, fhir_id: str) -> Tuple[bool, Dict]:
        """Delete a FHIR Appointment resource."""
        success, response = self._make_request('DELETE', f'/Appointment/{fhir_id}')
        
        if success:
            logger.info(f"Appointment {fhir_id} deleted from FHIR server")
        else:
            logger.error(f"Failed to delete appointment: {response}")
        
        return success, response

<<<<<<< HEAD
    # ─────────────────────────────────────────────
    #  DiagnosticReport (Lab Results) Operations
    # ─────────────────────────────────────────────
    def send_diagnostic_report(self, lab_result) -> Tuple[bool, str, Dict]:
        """
        Create a FHIR DiagnosticReport resource from a LabResult and send it to the FHIR server.

        Returns (success, fhir_id, response)
        """
        if not self.server_url:
            return False, "", {"error": "FHIR server not configured"}

        # Ensure patient/practitioner exist on FHIR server
        try:
            patient_success, patient_fhir_id, _ = self.create_patient(lab_result.patient)
            doctor_success, doctor_fhir_id, _ = self.create_practitioner(lab_result.doctor)
        except Exception as e:
            return False, "", {"error": str(e)}

        # Build minimal DiagnosticReport
        diagnostic = {
            "resourceType": "DiagnosticReport",
            "status": "final" if lab_result.status == 'completed' else 'preliminary',
            "code": {
                "coding": [
                    {"system": "http://loinc.org", "code": lab_result.test_code or "", "display": lab_result.test_name}
                ],
                "text": lab_result.test_name
            },
            "subject": {"reference": f"Patient/{patient_fhir_id}"},
            "issued": lab_result.completed_at.isoformat() if lab_result.completed_at else None,
            "performer": [{"reference": f"Practitioner/{doctor_fhir_id}"}],
            "presentedForm": []
        }

        # Observations for components
        results = []
        if isinstance(lab_result.components, dict) and lab_result.components:
            for name, comp in lab_result.components.items():
                obs = {
                    "resource": {
                        "resourceType": "Observation",
                        "code": {"text": name},
                        "valueString": str(comp.get('value')) if comp.get('value') is not None else None,
                        "referenceRange": [{"text": comp.get('reference_range')}] if comp.get('reference_range') else []
                    }
                }
                results.append(obs)
        else:
            # single result as observation
            obs = {
                "resource": {
                    "resourceType": "Observation",
                    "code": {"text": lab_result.test_name},
                    "valueString": str(lab_result.result_value) if lab_result.result_value is not None else None,
                    "referenceRange": [{"text": lab_result.reference_range}] if lab_result.reference_range else []
                }
            }
            results.append(obs)

        if results:
            diagnostic['result'] = [r['resource'] for r in results]

        # Post DiagnosticReport
        success, response = self._make_request('POST', '/DiagnosticReport', data=diagnostic)
        if success:
            fhir_id = response.get('id') or ''
            return True, fhir_id, response
        return False, "", response

=======
>>>>>>> b381c81bab0b6500d6e25aa0d8e664d8397d0550

# Global instance
fhir_service = FHIRService()
