# New API Endpoints Reference

All new endpoints are prefixed with `/api/auth/`

## Triage Scores Endpoints

### List/Create Triage Scores
- **GET** `/api/auth/triage-scores/` 
  - **Description:** Get all triage scores for current user
  - **Auth:** Required (JWT)
  - **Response:** List of triage scores
  - **Filters:** Can filter by patient

- **POST** `/api/auth/triage-scores/`
  - **Description:** Create new triage score
  - **Auth:** Required (Doctor only)
  - **Body:** See Payload Examples
  - **Response:** Created triage score object

### Get Patient's Triage History
- **GET** `/api/auth/triage-scores/by_patient/?patient_id=123`
  - **Description:** Get all triage scores for specific patient
  - **Auth:** Required (Doctor assigned to patient)
  - **Query Params:** `patient_id` (required)
  - **Response:** Ordered list newest first

### Get Urgent Patients
- **GET** `/api/auth/triage-scores/urgent_patients/`
  - **Description:** Get all urgent/critical patients for doctor
  - **Auth:** Required (Doctor only)
  - **Response:** Urgent patient list with latest scores
  - **Status Included:** resuscitation, emergency, urgent

### Retrieve Single Triage Score
- **GET** `/api/auth/triage-scores/{id}/`
  - **Description:** Get specific triage score details
  - **Auth:** Required
  - **Response:** Full triage score object

### Update Triage Score
- **PUT** `/api/auth/triage-scores/{id}/`
- **PATCH** `/api/auth/triage-scores/{id}/`
  - **Description:** Update triage score
  - **Auth:** Required (Creator only)
  - **Body:** Partial or full update
  - **Response:** Updated object

### Delete Triage Score
- **DELETE** `/api/auth/triage-scores/{id}/`
  - **Description:** Delete triage score
  - **Auth:** Required (Creator only)
  - **Response:** 204 No Content

---

## Consultation Notes Endpoints

### List/Create Notes
- **GET** `/api/auth/consultation-notes/`
  - **Description:** Get all notes for current user
  - **Auth:** Required
  - **Response:** List of consultation notes

- **POST** `/api/auth/consultation-notes/`
  - **Description:** Create new consultation note
  - **Auth:** Required (Doctor)
  - **Body:** See Payload Examples
  - **Response:** Created note object

### Get Notes by Appointment
- **GET** `/api/auth/consultation-notes/by_appointment/?appointment_id=456`
  - **Description:** Get all notes for specific appointment
  - **Auth:** Required
  - **Query Params:** `appointment_id` (required)
  - **Response:** Ordered list newest first

### Get Patient's Notes
- **GET** `/api/auth/consultation-notes/by_patient/?patient_id=123`
  - **Description:** Get all notes for patient
  - **Auth:** Required (Patient or assigned doctor)
  - **Query Params:** `patient_id` (required)
  - **Response:** Chronological list

### Retrieve Single Note
- **GET** `/api/auth/consultation-notes/{id}/`
  - **Description:** Get specific note details
  - **Auth:** Required

### Update Note
- **PUT** `/api/auth/consultation-notes/{id}/`
- **PATCH** `/api/auth/consultation-notes/{id}/`
  - **Description:** Update consultation note
  - **Auth:** Required (Creator only)

### Delete Note
- **DELETE** `/api/auth/consultation-notes/{id}/`
  - **Description:** Delete consultation note
  - **Auth:** Required (Creator only)
  - **Response:** 204 No Content

---

## Patient Event Timeline Endpoints

### List Events
- **GET** `/api/auth/patient-timeline/?patient_id=123`
  - **Description:** Get timeline events for patient
  - **Auth:** Required (Patient or assigned doctor)
  - **Query Params:** `patient_id` (required)
  - **Ordering:** `-event_date` (newest first)
  - **Response:** Latest 50 events
  - **Note:** Read-only endpoint

### Get Critical Events
- **GET** `/api/auth/patient-timeline/critical_events/?patient_id=123`
  - **Description:** Get only critical/urgent events
  - **Auth:** Required
  - **Query Params:** `patient_id` (required)
  - **Response:** Critical events only (latest 20)

### Retrieve Single Event
- **GET** `/api/auth/patient-timeline/{id}/`
  - **Description:** Get specific event details
  - **Auth:** Required

---

## Payload Examples

### Create Triage Score
```json
{
  "patient": 123,
  "urgency_level": "urgent",
  "overall_score": 75,
  "chief_complaint_severity": 8,
  "vital_signs_severity": 7,
  "mental_status_severity": 5,
  "pain_level": 8,
  "chief_complaint": "Severe headache",
  "assessment_notes": "Patient reports severe headache for 3 days..."
}
```

### Create Consultation Note
```json
{
  "appointment": 456,
  "patient": 123,
  "note_type": "progress-note",
  "content": "Patient improving on current treatment. Continue medications...",
  "medications_reviewed": "Amoxicillin 500mg BID, Ibuprofen PRN",
  "allergies_reviewed": "NKDA",
  "vital_signs": {
    "temperature": 37.2,
    "heart_rate": 72,
    "blood_pressure": "120/80",
    "respiratory_rate": 16,
    "oxygen_saturation": 98.5,
    "weight": 70.5
  }
}
```

### Create Timeline Event
```json
{
  "patient": 123,
  "event_type": "consultation-note",
  "title": "Follow-up consultation completed",
  "description": "Patient reviewed and improving",
  "event_date": "2026-04-15T14:00:00Z",
  "is_critical": false,
  "appointment": 456
}
```

---

## Common Query Parameters

### Filtering
- `?patient_id=123` - Filter by patient
- `?appointment_id=456` - Filter by appointment
- `?doctor_id=789` - Filter by doctor (where applicable)

### Ordering
- `?ordering=-created_at` - Newest first
- `?ordering=created_at` - Oldest first
- `?ordering=-event_date` - Latest events first

### Pagination
- `?page=1` - Get page 1
- `?page_size=20` - Items per page

---

## Status Codes

### Success
- `200 OK` - GET request successful
- `201 Created` - POST request successful
- `204 No Content` - DELETE successful

### Client Errors
- `400 Bad Request` - Invalid payload/parameters
- `401 Unauthorized` - No authentication token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found

### Server Errors
- `500 Internal Server Error` - Server error

---

## Response Format

All responses follow standard JSON format:

### List Response
```json
[
  {
    "id": 1,
    "patient": 123,
    "patient_name": "John Doe",
    "...": "..."
  }
]
```

### Error Response
```json
{
  "detail": "Not found.",
  "error": "Resource does not exist"
}
```

---

## Permissions Matrix

| Endpoint | Anonymous | Patient | Doctor |
|----------|-----------|---------|--------|
| GET triage scores | ✗ | ✓ Own only | ✓ Assigned |
| POST triage scores | ✗ | ✗ | ✓ |
| DELETE triage scores | ✗ | ✗ | ✓ Own only |
| GET notes | ✗ | ✓ Own only | ✓ Created |
| POST notes | ✗ | ✗ | ✓ |
| DELETE notes | ✗ | ✗ | ✓ Own only |
| GET timeline | ✗ | ✓ Own only | ✓ Assigned |
| POST timeline | ✗ | ✗ | ✓ |

---

## Rate Limiting

No rate limiting currently implemented. Consider adding for production:
- 100 requests/minute per user
- 1000 requests/hour per API key

---

## Caching

Consider implementing caching:
- Timeline events: 5 minute cache
- Triage scores: 2 minute cache
- Patient list: 10 minute cache

---

## Future Enhancements

- [ ] Bulk operations (export timeline as PDF)
- [ ] Prescription renewal endpoint
- [ ] Appointment reminders endpoint
- [ ] Timeline search/filter by event type
- [ ] Advanced triage score analytics
- [ ] Prescription refill history
- [ ] Note version history/audit trail
- [ ] GraphQL API alternative

