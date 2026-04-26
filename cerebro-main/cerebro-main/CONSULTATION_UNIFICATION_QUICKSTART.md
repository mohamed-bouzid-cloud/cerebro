# 🚀 CONSULTATION UNIFICATION - QUICK START

## The Problem Fixed

**Before:** System had TWO separate models causing confusion:
- ❌ `Consultation` model (appointments from patients)
- ❌ `Appointment` model (scheduled meetings)
- ❌ Doctors couldn't see consultation requests
- ❌ NOT FHIR-compliant

**Now:** ONE unified model - Appointments:
- ✅ Single source of truth
- ✅ Doctors see requests immediately
- ✅ FHIR R4 standard compliant
- ✅ Real-time 10-second polling

---

## For End Users

### 👨‍⚕️ Doctor's Workflow

1. **Login** as doctor@test.com
2. **Navigate** to "Clinical Dashboard" (select any patient)
3. **Look for** "Incoming Consultation Requests" panel
4. **See** list of pending requests with:
   - Patient name
   - Reason for consultation
   - Consultation type (video/audio/in-person)
   - Request date/time
5. **Click Accept** → Status becomes "Booked" (now in Appointments)
6. **Click Decline** → Status becomes "Cancelled"

### 👤 Patient's Workflow

1. **Login** as patient@test.com
2. **Browse** available doctors
3. **Click** "Request Consultation" button
4. **Select** consultation type and enter reason
5. **Submit** request
6. **Wait** for doctor's response (refreshes every 10 seconds)
7. **See** consultation appear in appointments when accepted

---

## Database / Model Summary

```
┌─────────────────────────────────────────┐
│    Appointment (UNIFIED MODEL)          │
├─────────────────────────────────────────┤
│ Status Workflow:                        │
│                                         │
│ proposed ──→ booked ──→ completed      │
│    ↓                        ↑           │
│    └─→ cancelled ───────────┘          │
│                                         │
│ Statuses:                              │
│ • proposed = Pending consultation      │
│ • requested = Awaiting doctor review   │
│ • booked = Confirmed appointment       │
│ • completed = Finished                 │
│ • cancelled = Rejected                 │
└─────────────────────────────────────────┘
```

---

## API Endpoints (For Developers)

### Doctor Gets Consultation Requests
```bash
GET /api/auth/appointments/incoming_consultations/
Authorization: Bearer <doctor_token>

Response: [
  {
    "id": 15,
    "patient_id": 2,
    "patient_name": "John Doe",
    "doctor_id": 1,
    "status": "proposed",
    "consultation_type": "video",
    "reason": "Back pain consultation",
    "created_at": "2026-04-15T10:30:00Z"
  }
]
```

### Doctor Accepts Consultation
```bash
POST /api/auth/appointments/15/accept_consultation/
Authorization: Bearer <doctor_token>

Response: {
  "status": "Consultation accepted",
  "appointment": { ... updated data ... }
}
```

### Doctor Rejects Consultation
```bash
POST /api/auth/appointments/15/reject_consultation/
Authorization: Bearer <doctor_token>

Response: {
  "status": "Consultation rejected"
}
```

### Patient Sends Consultation Request
```bash
POST /api/auth/appointments/
Authorization: Bearer <patient_token>

Body: {
  "doctor": 1,
  "consultation_type": "video",
  "reason": "Need medical advice",
  "status": "proposed"
}
```

---

## Files Changed

### Backend
- ✅ `accounts/models.py` - Unified Appointment model
- ✅ `accounts/serializers.py` - Updated AppointmentSerializer
- ✅ `accounts/views.py` - New viewset endpoints
- ✅ `accounts/urls.py` - Removed consultation routes
- ✅ `accounts/admin.py` - Removed Consultation admin
- ✅ `accounts/signals.py` - Removed Consultation signal
- ✅ `accounts/migrations/0007_*.py` - NEW migration

### Frontend
- ✅ `frontend/src/components/DoctorDashboard.jsx` - NEW IncomingConsultationsPanel
- ✅ `frontend/src/components/ConsultationModal.jsx` - Uses new endpoint

---

## Testing the Integration

### Quick Test (Copy-Paste)

```python
# In Django shell:
python manage.py shell

# Create a test consultation request
from accounts.models import Appointment, User

doctor = User.objects.get(role="doctor", email="doctor@test.com")
patient = User.objects.get(role="patient", email="patient@test.com")

apt = Appointment.objects.create(
    patient=patient,
    doctor=doctor,
    consultation_type="video",
    reason="Test consultation",
    status="proposed"
)

print(f"Created: {apt}")
print(f"Doctor: {apt.doctor.email}")
print(f"Patient: {apt.patient.email}")
print(f"Status: {apt.status}")
```

### Browser Test

1. Open DevTools (F12) → Network tab
2. Login as doctor
3. Look for request to: `appointments/incoming_consultations/`
4. Should return array of pending consultations
5. Click Accept/Decline buttons
6. See POST requests to `accept_consultation/` or `reject_consultation/`

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "No consultations show up" | Check 10-second polling working. Open Network tab, should see periodic GET requests. |
| "ImportError: Consultation" | Run migrations: `python manage.py migrate accounts` |
| "Accept button doesn't work" | Check console for network errors. Verify doctor is logged in with valid token. |
| "Data not visible after refresh" | Database might not have data. Create test consultation from admin or API. |
| "Panel not appearing" | Make sure `expandedSections.consultations` is true in code. |

---

## Key Concepts

### FHIR Appointment vs Consultation

- **Before**: Used `ServiceRequest` resource for consultations
- **Now**: Uses `Appointment` resource with status "proposed" for requests
- **Standard**: FHIR R4 Appointment (http://hl7.org/fhir/StructureDefinition/Appointment)

### Real-Time Sync

- Frontend polls every 10 seconds automatically
- On doctor login, `fetchConsultationRequests()` called
- Can manually refresh with bell icon or Accept/Decline buttons

### Status Meanings in Context

When a patient **requests** a consultation:
```
patient.consultations_as_patient = [Appointment(status="proposed")]
doctor.consultations_as_doctor = []  # NOT here yet!

But doctor's GET /incoming_consultations/ returns it!
↑ This is the key fix!
```

When doctor **accepts**:
```
appointment.status = "booked"
Now appears in: doctor.appointments_as_doctor
Both parties see it as a confirmed appointment
```

---

## Migration Details

**File:** `accounts/migrations/0007_alter_appointment_options_and_more.py`

**What changed:**
1. Added fields to Appointment:
   - `consultation_type` (CharField, default="general")
   - `reason` (TextField)
   - `meeting_link` (URLField)
2. Made `scheduled_at` optional (null=True)
3. Updated STATUS_CHOICES to include "proposed", "requested"
4. Deleted Consultation model entirely

**Applied successfully:** ✅

---

## Production Checklist

Before deploying:

- [ ] Run `python manage.py migrate` on production
- [ ] Update frontend with new panel component
- [ ] Test accept/decline workflow with real doctors
- [ ] Verify FHIR sync is configured (if using FHIR server)
- [ ] Monitor logs for signal errors during sync
- [ ] Brief users on "Incoming Consultation Requests" location
- [ ] Update documentation for support team

---

## Questions?

Refer to: [CONSULTATION_UNIFICATION.md](CONSULTATION_UNIFICATION.md) for detailed technical documentation.
