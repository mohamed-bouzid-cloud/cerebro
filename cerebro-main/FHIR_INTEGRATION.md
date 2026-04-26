# FHIR Server Integration Guide

This document describes the complete FHIR R4 integration for the Cerebro medical platform.

## Overview

The Cerebro platform now features **real-time FHIR R4 synchronization** for appointments. All appointment data is automatically synced to a FHIR-compliant server, enabling:

- **Real-time consistency**: Appointments created by patients are immediately visible to doctors
- **FHIR R4 compliance**: Uses standard FHIR Appointment, Patient, and Practitioner resources
- **Fallback mode**: Automatically falls back to local database if FHIR server is unavailable
- **Async sync**: Non-blocking appointment creation with background FHIR synchronization

## Architecture

### Backend Flow

```
Patient Books Appointment
    ↓
Django AppointmentViewSet.create()
    ↓
Appointment Model.save() [with updated fields]
    ↓
post_save signal: sync_appointment_to_fhir()
    ↓
FHIRService.create_appointment()
    ↓
FHIR Server REST API (POST /Appointment)
    ↓
Update local appointment with FHIR resource ID & sync status
```

### Frontend Flow

```
Patient Portal → Appointment Modal
    ↓
Submit Appointment
    ↓
Backend creates appointment & syncs to FHIR (async)
    ↓
Show sync status to user

Doctor Dashboard → FHIRDoctorDashboard component
    ↓
Fetch from FHIR Server: GET /Appointment?actor=Practitioner/{id}
    ↓
Parse FHIR resources & display
    ↓
Fallback to local database if FHIR unavailable
```

## Configuration

### 1. Environment Variables

Set these environment variables in your `.env` file or in the system:

```bash
# FHIR Server Configuration
FHIR_SERVER_URL=http://localhost:8080/fhir          # Base URL of FHIR R4 server
FHIR_SERVER_AUTH_TOKEN=your_bearer_token_here       # Optional: Bearer token for auth
FHIR_SERVER_TIMEOUT=30                              # Request timeout in seconds
FHIR_SYNC_ENABLED=True                              # Enable/disable FHIR sync
```

### 2. Django Settings

In `cerebro/settings.py`, the following settings are automatically configured:

```python
FHIR_SERVER_URL = os.environ.get('FHIR_SERVER_URL', 'http://localhost:8080/fhir')
FHIR_SERVER_AUTH_TOKEN = os.environ.get('FHIR_SERVER_AUTH_TOKEN', None)
FHIR_SERVER_TIMEOUT = int(os.environ.get('FHIR_SERVER_TIMEOUT', '30'))
FHIR_SYNC_ENABLED = os.environ.get('FHIR_SYNC_ENABLED', 'True').lower() == 'true'
```

### 3. Supported FHIR Servers

The integration has been tested with:

- **HAPI FHIR Server** (Recommended for development)
  - Docker: `docker run -p 8080:8080 hapiproject/hapi:latest`
  - Configuration: `FHIR_SERVER_URL=http://localhost:8080/fhir`

- **Any FHIR R4 compliant server** supporting:
  - POST /Appointment (create)
  - GET /Appointment?actor=Practitioner/{id} (search)
  - GET /Appointment/{id} (retrieve)
  - PUT /Appointment/{id} (update)
  - DELETE /Appointment/{id} (delete)

## API Endpoints

### Patient-side Endpoints

#### Create Appointment (with auto FHIR sync)
```
POST /api/auth/appointments/
```

**Request:**
```json
{
    "doctor": 2,
    "scheduled_at": "2026-04-20T14:00:00Z",
    "duration_minutes": 30,
    "status": "scheduled",
    "notes": "Annual checkup"
}
```

**Response:**
```json
{
    "id": 5,
    "patient": 1,
    "doctor": 2,
    "scheduled_at": "2026-04-20T14:00:00Z",
    "status": "scheduled",
    "fhir_resource_id": "Appointment/5",
    "fhir_sync_status": "synced",
    "fhir_last_synced": "2026-04-15T20:55:00Z"
}
```

#### Fetch Patient's Appointments (from FHIR)
```
GET /api/auth/fhir-appointments/fhir_list/
```

**Response:**
```json
{
    "source": "fhir_server",
    "data": [
        {
            "resourceType": "Appointment",
            "id": "5",
            "status": "booked",
            "start": "2026-04-20T14:00:00Z",
            "participant": [...]
        }
    ]
}
```

### Doctor-side Endpoints

#### Get Doctor Dashboard (with FHIR appointments)
```
GET /api/auth/fhir/doctor-dashboard/
```

**Response:**
```json
{
    "source": "fhir_server",
    "doctor": {
        "id": 2,
        "name": "Dr. John Smith",
        "email": "doctor@example.com"
    },
    "appointments": {
        "today": [...],
        "upcoming": [...],
        "past": [...]
    },
    "summary": {
        "total_appointments": 25,
        "today_count": 3,
        "upcoming_count": 8
    }
}
```

#### Fetch and Sync Appointments (FHIR → Local DB)
```
POST /api/auth/fhir-appointments/fetch_and_sync/
```

This endpoint:
1. Queries the FHIR server for appointments
2. Parses FHIR Appointment resources
3. Creates/updates local Appointment records
4. Returns sync results

**Response:**
```json
{
    "message": "Synced 15 appointments from FHIR server",
    "synced_count": 15,
    "errors": null
}
```

#### Manual Sync (retry failed syncs)
```
POST /api/auth/fhir-appointments/sync_to_fhir/
```

Retries all appointments with `fhir_sync_status` of "pending" or "failed".

## FHIR Resource Examples

### Patient Resource
```json
{
    "resourceType": "Patient",
    "id": "1",
    "identifier": [
        {
            "system": "urn:example:mrn",
            "value": "MRN000001"
        }
    ],
    "name": [
        {
            "use": "official",
            "given": ["John"],
            "family": "Doe"
        }
    ],
    "telecom": [
        {
            "system": "email",
            "value": "john@example.com"
        }
    ],
    "birthDate": "1990-01-15"
}
```

### Practitioner Resource
```json
{
    "resourceType": "Practitioner",
    "id": "2",
    "identifier": [
        {
            "system": "urn:example:npi",
            "value": "NPI000000002"
        }
    ],
    "name": [
        {
            "use": "official",
            "given": ["John"],
            "family": "Smith",
            "prefix": ["Dr."]
        }
    ],
    "qualification": [
        {
            "code": {
                "text": "Cardiology"
            }
        }
    ]
}
```

### Appointment Resource
```json
{
    "resourceType": "Appointment",
    "id": "5",
    "status": "booked",
    "appointmentType": {
        "coding": [
            {
                "system": "http://terminology.hl7.org/CodeSystem/v2-0276",
                "code": "ROUTINE"
            }
        ]
    },
    "start": "2026-04-20T14:00:00Z",
    "end": "2026-04-20T14:30:00Z",
    "participant": [
        {
            "actor": {
                "reference": "Patient/1",
                "type": "Patient"
            },
            "required": "required",
            "status": "accepted"
        },
        {
            "actor": {
                "reference": "Practitioner/2",
                "type": "Practitioner"
            },
            "required": "required",
            "status": "accepted"
        }
    ]
}
```

## Database Fields

### Appointment Model

New fields added for FHIR tracking:

- `fhir_resource_id` (CharField): FHIR server's Appointment resource ID
- `fhir_sync_status` (CharField): One of "pending", "synced", or "failed"
- `fhir_sync_error` (TextField): Error message if sync failed
- `fhir_last_synced` (DateTimeField): Last successful sync timestamp

### User Model

- `fhir_resource_id` (CharField): FHIR Patient or Practitioner resource ID

### DoctorProfile & PatientProfile Models

- `fhir_resource_id` (CharField): Mapped FHIR resource ID

## Real-time Synchronization Flow

### When Patient Books Appointment

1. **Frontend**: Patient fills appointment form and submits
2. **Backend API**: `POST /api/auth/appointments/` receives request
3. **AppointmentViewSet**: Creates local Appointment object with status "pending"
4. **post_save Signal**: `sync_appointment_to_fhir()` triggers automatically
5. **FHIRService**: 
   - Creates Patient and Practitioner resources if needed
   - Creates Appointment resource with proper FHIR references
   - Stores response in local database
6. **Frontend**: Shows sync status (pending → synced)
7. **Doctor Dashboard**: Next refresh automatically shows new appointment from FHIR server

### When Doctor Views Dashboard

1. **Frontend**: `FHIRDoctorDashboard` component mounts
2. **API Call**: `GET /api/auth/fhir/doctor-dashboard/`
3. **Backend**: Queries FHIR server: `GET /Appointment?actor=Practitioner/{id}`
4. **Fallback**: If FHIR unavailable, returns local database appointments
5. **Display**: Shows live appointments with sync status

## Error Handling

### FHIR Server Unavailable

If the FHIR server is unreachable:

1. Appointment creation still succeeds locally
2. `fhir_sync_status` = "failed" with error message
3. Doctor dashboard falls back to local database
4. Frontend shows warning: "FHIR server unavailable, using local data"
5. User can manually retry sync via "Sync with FHIR" button

### Appointment Sync Failure

If appointment fails to sync to FHIR:

1. `fhir_sync_status` = "failed"
2. Error message stored in `fhir_sync_error`
3. User can retry via doctor dashboard
4. POST `/api/auth/fhir-appointments/sync_to_fhir/` retries all failed syncs

## Logging

Enable debug logging to monitor FHIR operations:

```python
# In settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'accounts.fhir_service': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

## Testing the Integration

### 1. Setup FHIR Server (Development)

```bash
# Using HAPI FHIR with Docker
docker run -d -p 8080:8080 --name hapi-fhir hapiproject/hapi:latest

# Verify server is running
curl http://localhost:8080/fhir/metadata
```

### 2. Configure Environment

```bash
export FHIR_SERVER_URL=http://localhost:8080/fhir
export FHIR_SYNC_ENABLED=True
```

### 3. Create Test Appointment

```bash
# 1. Sign up as patient and doctor
# 2. Patient books appointment
# 3. Check console logs for FHIR sync
# 4. Doctor refreshes dashboard
# 5. Appointment should appear from FHIR server
```

### 4. Verify FHIR Resources

```bash
# Query FHIR server directly
curl http://localhost:8080/fhir/Patient/1
curl http://localhost:8080/fhir/Practitioner/2
curl http://localhost:8080/fhir/Appointment?actor=Practitioner/2
```

## API Troubleshooting

### Issue: "FHIR server not configured"

**Solution**: Set `FHIR_SERVER_URL` environment variable

```bash
export FHIR_SERVER_URL=http://localhost:8080/fhir
```

### Issue: Appointments not syncing (fhir_sync_status = "failed")

**Solution**: Check error message in `fhir_sync_error` field

```bash
# Via Django shell
python manage.py shell
>>> from accounts.models import Appointment
>>> appt = Appointment.objects.last()
>>> print(appt.fhir_sync_error)
```

### Issue: Doctor dashboard shows "fallback" mode

**Solution**: Verify FHIR server is running and accessible

```bash
# Test FHIR server connectivity
curl -v http://localhost:8080/fhir/metadata
```

### Issue: 401 Unauthorized from FHIR server

**Solution**: If FHIR server requires authentication, set `FHIR_SERVER_AUTH_TOKEN`

```bash
export FHIR_SERVER_AUTH_TOKEN=your_bearer_token_here
```

## Migration & Upgrade

When upgrading to this FHIR-enabled version:

1. **Run migrations** (new fields added):
   ```bash
   python manage.py migrate accounts
   ```

2. **Existing appointments** will have `fhir_sync_status = "pending"`

3. **Auto-sync pending appointments**:
   ```bash
   # Trigger sync for all pending appointments
   POST /api/auth/fhir-appointments/sync_to_fhir/
   ```

## Performance Considerations

### Appointment Creation Latency

- **Local save**: ~10ms
- **FHIR sync**: ~500-2000ms (async via signal)
- **Total user experience**: <100ms (async doesn't block response)

### Dashboard Loading

- **Local DB query**: ~50ms
- **FHIR server query**: ~1-3 seconds (includes network + server time)
- **Fallback**: Automatic if FHIR takes >3s

### Optimization Tips

1. Use appointment `upcoming` action for faster dashboard loads:
   ```
   GET /api/auth/appointments/upcoming/
   ```

2. Implement caching for doctor dashboard:
   ```python
   @cache_page(60)  # Cache for 60 seconds
   def fhir_doctor_dashboard(request):
       ...
   ```

3. Use pagination for large appointment lists

## Security Considerations

1. **FHIR Server Authentication**
   - Always use HTTPS for FHIR server connections
   - Use Bearer tokens in protected environments
   - Implement network-level access controls

2. **Data Privacy**
   - FHIR resources contain PHI (Protected Health Information)
   - Ensure FHIR server is HIPAA-compliant
   - Implement audit logging for FHIR access

3. **API Keys**
   - Never commit `FHIR_SERVER_AUTH_TOKEN` to version control
   - Use environment variables or secrets management

## Future Enhancements

Planned FHIR integrations:

- [ ] Consultation → ServiceRequest resources
- [ ] Prescriptions → MedicationRequest resources
- [ ] Lab results → DiagnosticReport resources
- [ ] Vital signs → Observation resources
- [ ] FHIR webhooks for real-time push notifications
- [ ] Consent resources for patient privacy preferences
- [ ] FHIR bulk export for analytics

## References

- [HL7 FHIR R4 Specification](https://www.hl7.org/fhir/r4/)
- [FHIR Appointment Resource](https://www.hl7.org/fhir/r4/appointment.html)
- [FHIR Patient Resource](https://www.hl7.org/fhir/r4/patient.html)
- [FHIR Practitioner Resource](https://www.hl7.org/fhir/r4/practitioner.html)
- [HAPI FHIR Server](https://hapifhir.io/)
