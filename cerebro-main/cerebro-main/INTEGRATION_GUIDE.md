# Integration Guide - New Features in Doctor Dashboard

## Quick Start

To add all 7 new features to your Doctor Dashboard, follow these steps:

---

## Step 1: Update DoctorDashboard.jsx Imports

Add these imports at the top of `frontend/src/components/DoctorDashboard.jsx`:

```javascript
import AppointmentCalendar from './AppointmentCalendar';
import TriageScorePanel from './TriageScorePanel';
import UrgentAlertPanel from './UrgentAlertPanel';
import ConsultationNotesForm from './ConsultationNotesForm';
import FollowUpScheduling from './FollowUpScheduling';
import PatientHistoryTimeline from './PatientHistoryTimeline';
import EPrescriptionForm from './EPrescriptionForm';
```

---

## Step 2: Add Components to Dashboard Layout

Inside your dashboard JSX return statement, add sections for new features:

```javascript
// Add this near the top (after urgent patients should be displayed)
<UrgentAlertPanel isDoctor={true} />

// Add in main content area where you want features
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
  <AppointmentCalendar patientId={selectedPatient?.id} isDoctor={true} />
  <TriageScorePanel patientId={selectedPatient?.id} isDoctor={true} />
</div>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
  <FollowUpScheduling 
    patientId={selectedPatient?.id}
    patientName={selectedPatient?.first_name + ' ' + selectedPatient?.last_name}
    isDoctor={true}
  />
  <EPrescriptionForm 
    patientId={selectedPatient?.id}
    patientName={selectedPatient?.first_name + ' ' + selectedPatient?.last_name}
    isDoctor={true}
  />
</div>

// For appointment/encounter specific views:
{selectedAppointment && (
  <div className="space-y-6 mb-6">
    <ConsultationNotesForm 
      appointmentId={selectedAppointment.id}
      patientId={selectedPatient?.id}
      isDoctor={true}
    />
  </div>
)}

// Timeline - full width panel
<PatientHistoryTimeline 
  patientId={selectedPatient?.id}
  isDoctor={true}
/>
```

---

## Step 3: Component Usage Reference

### AppointmentCalendar
```javascript
<AppointmentCalendar 
  patientId={123}           // Required: Patient ID
  isDoctor={true}           // Optional: Shows doctor controls
/>
```
**Features:** Month view, appointment creation, consultation type indicators

---

### TriageScorePanel
```javascript
<TriageScorePanel 
  patientId={123}           // Required: Patient ID
  isDoctor={true}           // Optional: Shows form to create assessments
/>
```
**Features:** Urgency level display, component breakdown, assessment form

---

### UrgentAlertPanel
```javascript
<UrgentAlertPanel 
  isDoctor={true}           // Shows only for doctors
/>
```
**Features:** Auto-refreshes every 30s, shows critical patients only

---

### FollowUpScheduling
```javascript
<FollowUpScheduling 
  appointmentId={456}       // Optional: Link to parent appointment
  patientId={123}           // Required: Patient ID
  patientName="John Doe"    // Optional: Display name
  isDoctor={true}           // Optional: Shows scheduling form
/>
```
**Features:** Quick scheduling, priority levels, upcoming appointments display

---

### EPrescriptionForm
```javascript
<EPrescriptionForm 
  patientId={123}           // Required: Patient ID
  patientName="John Doe"    // Optional: Display name
  isDoctor={true}           // Optional: Shows creation form
/>
```
**Features:** Create/edit/cancel prescriptions, automatic expiry calculation

---

### ConsultationNotesForm
```javascript
<ConsultationNotesForm 
  appointmentId={456}       // Required: Appointment ID
  patientId={123}           // Required: Patient ID
  isDoctor={true}           // Optional: Shows form to write notes
/>
```
**Features:** Create/edit/delete notes, vital signs capture, note type selection

---

### PatientHistoryTimeline
```javascript
<PatientHistoryTimeline 
  patientId={123}           // Required: Patient ID
  isDoctor={true}           // Optional: Doctor-specific view
/>
```
**Features:** Chronological event display, critical events filter, event type legend

---

## Step 4: Verify API Configuration

Ensure your backend is running:

```bash
cd cerebro-main
venv\Scripts\activate.ps1  # or your activation script
python manage.py runserver 0.0.0.0:8000
```

And frontend:
```bash
cd frontend
npm run dev
```

---

## Step 5: Test the Integration

1. Navigate to Doctor Dashboard
2. Select a patient from the sidebar
3. Scroll through new components to verify they load
4. Test CRUD operations:
   - Create a new appointment
   - Add a triage assessment
   - Schedule a follow-up
   - Write a prescription
   - Add consultation notes

---

## Component Data Flow

```
User selects Patient (ID=123)
    ↓
Pass patientId to all components
    ↓
Components fetch from `/api/auth/{endpoint}/?patient_id=123`
    ↓
Data displays in each component
    ↓
User performs action (create, edit, delete)
    ↓
Component POST/PUT/DELETE to API
    ↓
Component refetches data (auto-update)
    ↓
Display updated in UI
```

---

## API Response Format Examples

### Triage Score Response
```json
{
  "id": 1,
  "patient": 123,
  "patient_name": "John Doe",
  "urgency_level": "urgent",
  "overall_score": 75,
  "chief_complaint_severity": 8,
  "vital_signs_severity": 7,
  "mental_status_severity": 5,
  "pain_level": 8,
  "chief_complaint": "Severe chest pain",
  "assessment_notes": "Patient reports...",
  "created_at": "2026-04-15T10:30:00Z"
}
```

### Prescription Response
```json
{
  "id": 1,
  "medication_name": "Amoxicillin",
  "dosage": "500mg",
  "route": "oral",
  "frequency": "twice-daily",
  "duration_days": 10,
  "quantity": 20,
  "refills_remaining": 0,
  "status": "active",
  "start_date": "2026-04-15",
  "expiry_date": "2026-04-25",
  "notes": "Take with food"
}
```

### Timeline Event Response
```json
{
  "id": 1,
  "patient": 123,
  "event_type": "consultation-note",
  "title": "Follow-up consultation completed",
  "description": "Patient improving, continue current treatment",
  "event_date": "2026-04-15T14:00:00Z",
  "is_critical": false,
  "appointment": 456,
  "created_at": "2026-04-15T14:05:00Z"
}
```

---

## Styling & Customization

All components use Tailwind CSS classes. To customize:

### Colors:
- Blue: `bg-blue-600` → Change to your preferred color
- Green: `bg-green-600` → Success/positive actions
- Red: `bg-red-600` → Critical/urgent alerts

### Animations:
All components use Framer Motion. To modify:
- `initial={{ opacity: 0 }}` → Starting animation state
- `animate={{ opacity: 1 }}` → End animation state
- `transition={{ delay: 0.1 }}` → Timing

### Responsiveness:
- `md:` prefix → Medium screens and above
- `lg:` prefix → Large screens and above
- `grid-cols-1 md:grid-cols-2` → 1 col mobile, 2 cols desktop

---

## Troubleshooting

### Components not loading?
1. Check browser console for errors
2. Verify patient ID is being passed
3. Check API is running on localhost:8000
4. Verify access token in localStorage

### API calls failing?
1. Check Django server logs
2. Verify authorization header is present
3. Check request payload format matches serializer
4. Verify patient permissions (doctor can only see assigned patients)

### Styling issues?
1. Ensure Tailwind CSS is compiled
2. Check Lucide icons are imported correctly
3. Verify Framer Motion is installed

---

## Next Steps After Integration

1. **Add notifications** - Toast alerts for triage alerts
2. **Export features** - PDF generation for prescriptions
3. **Reminders** - Email/SMS for follow-ups
4. **Analytics** - Dashboard stats on appointments/triage
5. **Bulk operations** - Export timeline as PDF report
6. **Mobile optimization** - Responsive design for tablets

---

## Deployment Checklist

- [ ] All imports added to DoctorDashboard.jsx
- [ ] Components placed in correct layout
- [ ] Backend migrations applied (`python manage.py migrate`)
- [ ] API endpoints tested with Postman
- [ ] Frontend components rendering without console errors
- [ ] CRUD operations working (create, read, update, delete)
- [ ] Patient permissions checked (doctor can only see assigned patients)
- [ ] Responsive design tested on mobile/tablet
- [ ] Animations smooth and performant
- [ ] Error handling in place for failed API calls

