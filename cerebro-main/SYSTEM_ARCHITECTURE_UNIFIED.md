# System Architecture - Consultation Unified

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CEREBRO HEALTHCARE SYSTEM                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────┐  ┌──────────────────────────────┐ │
│  │  PATIENT SIDE                   │  │  DOCTOR SIDE                 │ │
│  ├─────────────────────────────────┤  ├──────────────────────────────┤ │
│  │                                 │  │                              │ │
│  │  1. Click "Request              │  │  1. Login to Dashboard       │ │
│  │     Consultation"               │  │                              │ │
│  │        ↓                        │  │  2. View "Incoming           │ │
│  │  2. Select Type + Reason        │  │     Consultation Requests"   │ │
│  │        ↓                        │  │     (Amber-colored panel)    │ │
│  │  3. Submit                      │  │        ↓                     │ │
│  │        ↓                        │  │  3. See pending requests:    │ │
│  │  4. POST /appointments/         │  │     • Patient name           │ │
│  │     {                           │  │     • Reason                 │ │
│  │       doctor: 1,                │  │     • Type (video/audio)     │ │
│  │       consultation_type: "video"│  │     • Date requested         │ │
│  │       reason: "...",            │  │        ↓                     │ │
│  │       status: "proposed"        │  │  4. Click [Accept] or        │ │
│  │     }                           │  │     [Decline]                │ │
│  │        ↓                        │  │        ↓                     │ │
│  │  5. Appointment created ✅      │  │  5. POST /accept_consultation│
│  │     (status="proposed")         │  │     or /reject_consultation  │ │
│  │                                 │  │        ↓                     │ │
│  └─────────────────────────────────┘  │  6. Status changes:          │ │
│                                         │     proposed → booked        │ │
│                                         │     or → cancelled           │ │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │         SHARED DATABASE - Single Appointment Model              │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ ✅ ONE TABLE: appointments_appointment                          │  │
│  │ ✅ Status progression: proposed → booked → completed           │  │
│  │ ✅ Fields: patient, doctor, reason, consultation_type,         │  │
│  │   scheduled_at, meeting_link, status, fhir_resource_id, ...   │  │
│  │ ✅ FHIR Synced: Auto-exports to FHIR Appointment resource      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema (Simplified)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Appointment Table                            │
├─────────────────────────────────────────────────────────────────┤
│ id (PK)           │ 1, 2, 3, ...                               │
│ patient_id (FK)   │ References User(role='patient')           │
│ doctor_id (FK)    │ References User(role='doctor')            │
│ scheduled_at      │ DateTime (nullable - NULL for pending)    │
│ status            │ proposed/requested/booked/completed       │
│ consultation_type │ video/audio/in-person/follow-up/general   │
│ reason            │ TextField - why patient requested          │
│ meeting_link      │ URLField - for virtual consultations      │
│ notes             │ TextField - doctor's notes                 │
│ created_at        │ DateTime - when request created            │
│ updated_at        │ DateTime - when last modified              │
│ fhir_resource_id  │ String - FHIR Appointment ID               │
│ fhir_sync_status  │ pending/synced/failed                      │
│ fhir_sync_error   │ TextField - error details if failed        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Status State Machine

```
                    ┌──────────────┐
                    │  proposed    │  ← Patient requests consultation
                    │  (Pending)   │
                    └──────┬───────┘
                           │
                    ┌──────┴────────┐
                    │               │
                    ▼               ▼
            ┌────────────┐   ┌────────────┐
            │  booked    │   │ cancelled  │
            │(Accepted)  │   │(Rejected)  │
            └─────┬──────┘   └────────────┘
                  │
                  │
                  ▼
            ┌────────────┐
            │ completed  │
            │(After call)│
            └────────────┘
```

**Doctor Actions:**
- `[Accept]` button → proposed → booked
- `[Decline]` button → proposed → cancelled

---

## API Flow Diagram

```
┌─────────────┐                                    ┌──────────────┐
│   PATIENT   │                                    │    DOCTOR    │
│  Frontend   │                                    │   Frontend   │
└──────┬──────┘                                    └──────┬───────┘
       │                                                   │
       │  POST /appointments/                             │
       │  { doctor, reason,                               │
       │    consultation_type, status="proposed" }        │
       │────────────────────────────────────────────────→ │
       │                                                   │
       │  ← 201 Created                                   │
       │                                                   │
       │                                  GET /appointments/
       │                                  incoming_consultations/
       │                                  (Every 10 seconds)
       │                                    ↓              │
       │                         [Doctor sees it!] ←────────┘
       │                                    │
       │                                    │
       │                         Click [Accept]
       │                                    │
       │                        POST /accept_consultation/
       │                                    ↓
       │                    Status: proposed → booked
       │
       │  ← Appointment appears in doctor's calendar
       │  ← Notification (if enabled)
       │
```

---

## Key Improvements vs. Before

| Aspect | BEFORE ❌ | AFTER ✅ |
|--------|----------|---------|
| **Models** | Consultation + Appointment (2 tables) | Appointment (1 table) |
| **Endpoints** | `/consultations/` and `/appointments/` | `/appointments/` with sub-actions |
| **Doctor Visibility** | Had to check 2 places | One unified incoming panel |
| **Real-time** | Manual refresh only | Auto-polls every 10 sec |
| **FHIR Compliance** | ServiceRequest for consultations | Appointment with status="proposed" |
| **Data Consistency** | Could get out of sync | Single source of truth |
| **API Complexity** | High (two separate flows) | Simple (one flow with statuses) |
| **Database Queries** | Had to JOIN 2 tables | Single table query |

---

## FHIR Resource Mapping

```
Consultation Request in UI
         ↓
      Appointment
      (status="proposed")
         ↓
    FHIR Appointment
    {
      "resourceType": "Appointment",
      "id": "apt-123",
      "status": "proposed",
      "participant": [
        {
          "actor": { "reference": "Patient/2" },
          "status": "needs-action"
        },
        {
          "actor": { "reference": "Practitioner/1" },
          "status": "needs-action"
        }
      ],
      "reasonCode": [{
        "text": "Upper back pain"
      }],
      "serviceType": [{
        "coding": [{
          "system": "http://snomed.info/sct",
          "code": "29303009",
          "display": "Video Consultation"
        }]
      }]
    }
```

---

## Polling Mechanism (Frontend)

```
useEffect(() => {
    // Initial fetch
    fetchConsultationRequests();
    
    // Set up 10-second polling
    const interval = setInterval(() => {
        fetchConsultationRequests();
    }, 10000);
    
    return () => clearInterval(interval);  // Cleanup
}, []);

// When user clicks Accept/Decline:
const handleAcceptConsultation = async (id) => {
    await fetch(`/api/auth/appointments/${id}/accept_consultation/`, 
                { method: 'POST' });
    
    // Immediately refresh (don't wait for next poll)
    fetchConsultationRequests();
};
```

**Result:**
- Doctors see new consultation requests within ~10 seconds
- Immediate refresh after accepting/declining
- Automatic cleanup on component unmount

---

## Error Handling

```
Try to Accept Consultation
    ↓
POST /accept_consultation/{id}
    ├─ 200 OK → Status changes ✅
    │          Refresh list
    │
    ├─ 400 Bad Request → "Cannot accept this consultation"
    │                    (Invalid status or not doctor)
    │
    ├─ 404 Not Found → "Consultation not found"
    │
    └─ 500 Server Error → "Error accepting consultation"
                          Check logs
```

---

## Performance Considerations

| Operation | Before | After |
|-----------|--------|-------|
| Doctor views pending consultations | 2 queries (2 tables) | 1 query (1 table) ⚡ |
| Patient sends consultation request | Special logic | Standard Appointment save |
| Doctor accepts consultation | Update + Signal | Update + Signal (same) |
| Real-time polling | N/A | 10-sec interval (configurable) |
| FHIR Sync | ServiceRequest export | Appointment export (standard) |

**Polling Impact:** ~1-2 lightweight GET requests per doctor every 10 seconds
- Small payload (JSON array of 5-10 appointments)
- Cacheable by browser
- Negligible server load

---

## Testing Scenarios

### Scenario 1: Happy Path
```
1. Patient A logs in
2. Requests video consultation from Doctor B (reason: "Headache")
3. Status: proposed
4. Doctor B logs in, waits <10 sec
5. Sees request in "Incoming Consultation Requests" panel
6. Clicks [Accept]
7. Status: booked
8. Consultation now appears in both parties' schedules
✅ PASS
```

### Scenario 2: Decline Request
```
1. Patient A requests consultation
2. Doctor B sees request
3. Doctor B clicks [Decline]
4. Status: cancelled
5. Request disappears from Doctor B's incoming panel
6. Patient A eventually sees it was declined
✅ PASS
```

### Scenario 3: Multiple Requests
```
1. Patient A requests (video)
2. Patient C requests (in-person)
3. Patient E requests (follow-up)
4. Doctor B sees 3 requests in panel, listed newest first
5. Can accept/decline each independently
✅ PASS
```

---

## Deployment Checklist

- [x] Backup database before migration
- [x] Run `python manage.py migrate accounts`
- [x] Update frontend with new DoctorDashboard component
- [x] Test accept/decline workflow
- [x] Verify FHIR sync working (if enabled)
- [x] Monitor logs for errors
- [x] Brief support team on new "Incoming Consultation Requests" panel
- [x] Update user documentation

---

**Created:** April 15, 2026  
**Status:** ✅ Complete and Tested  
**System:** CEREBRO Healthcare Platform
