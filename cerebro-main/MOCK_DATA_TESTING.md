# 🏥 Mock Data & Appointment Testing Guide

## ⚡ Quick Start

### Option 1: Real Backend (Recommended for Full Testing)

**Setup:**
```bash
# Terminal 1: Django Backend
cd cerebro-main
venv\Scripts\activate
python manage.py seed_test_data
python manage.py runserver 0.0.0.0:8000
```

```bash
# Terminal 2: React Frontend
cd cerebro-main/frontend
npm run dev
```

**Test Flow:**
1. Login as doctor: `doctor@test.com` / password
2. See 5 real patients in sidebar
3. Open incognito: `john.doe@patient.com` / `testpass123`
4. Patient creates appointment → appears in doctor dashboard within 10 seconds ✅

---

### Option 2: Mock Data Only (Backend Down)

**Setup:**
```bash
# Only run frontend
cd cerebro-main/frontend
npm run dev
```

**What happens:**
1. Doctor dashboard loads
2. Detects API failure
3. Automatically switches to **Demo Mode**
4. Shows 5 mock patients in sidebar
5. Shows 5 mock appointments
6. Shows mock FHIR clinical data
7. "Demo Mode" badge visible in header (yellow)

**Test with mock data:**
1. Click any patient in sidebar
2. See full clinical dashboard with:
   - Mock conditions (Hypertension, Diabetes)
   - Mock medications (Lisinopril, Metformin)
   - Mock allergies (Penicillin allergy)
   - Mock vital signs (BP, Heart Rate)
   - Mock appointments for this patient

---

## 📊 Mock Data Contents

### 5 Test Patients
| Name | Email | Age | Blood Type |
|------|-------|-----|-----------|
| John Doe | john.doe@patient.com | 34 | O+ |
| Jane Smith | jane.smith@patient.com | 41 | A+ |
| Robert Johnson | robert.johnson@patient.com | 32 | B+ |
| Emily Williams | emily.williams@patient.com | 38 | A- |
| Michael Brown | michael.brown@patient.com | 29 | O- |

### 5 Test Appointments
All appointments assigned to **Dr. Sarah Mitchell** (Cardiology):

| Patient | Date | Time | Reason |
|---------|------|------|--------|
| John Doe | +2 days | 10:00 AM | Annual Checkup |
| Jane Smith | +3 days | 2:00 PM | Hypertension Follow-up |
| Robert Johnson | +1 day | 4:00 PM | Chest Pain Evaluation |
| Emily Williams | +5 days | 9:00 AM | Diabetes Management |
| Michael Brown | +7 days | 11:00 AM | Pre-operative Assessment |

### Mock Clinical Data per Patient
- **Conditions**: 1-2 chronic conditions (Hypertension, Diabetes, etc.)
- **Medications**: 1-2 active medications with dosages
- **Allergies**: 1-2 drug allergies with severity
- **Vital Signs**: Latest BP, Heart Rate measurements
- **Status**: All marked as "active" patients

---

## 🔄 Fallback Logic

### When Real Data is Available
```
✅ Backend running (http://localhost:8000)
✅ Patients exist in database
✅ Appointments exist
↓
Display REAL data
No "Demo Mode" badge
Real-time updates every 10 seconds
```

### When Mock Data Kicks In
```
❌ Backend offline OR
❌ No patients in database OR
❌ API returns error OR
❌ Network unreachable
↓
Display MOCK data
Show "Demo Mode" badge (yellow)
UI fully functional for testing
Automatically switches to real data when backend recovers
```

---

## 🎯 Testing Scenarios

### Scenario 1: Full End-to-End
**Goal:** Test real appointment workflow

**Steps:**
1. Run both backend + frontend
2. Login as doctor
3. See 5 real test patients from seed command
4. Open incognito window
5. Login as `john.doe@patient.com` / `testpass123`
6. Patient clicks "Consultations" → creates appointment
7. Back to doctor window
8. Wait 10 seconds or click bell icon 🔔
9. New appointment appears in dashboard ✅

**Expected:**
- No "Demo Mode" badge
- Appointment shows real patient name
- Updates in real-time

---

### Scenario 2: Offline Testing
**Goal:** Test UI with mock data when backend is down

**Steps:**
1. Frontend running only (no backend)
2. Login as doctor
3. Dashboard loads
4. "Demo Mode" badge appears (yellow with Wi-Fi off icon)
5. 5 mock patients visible in sidebar
6. 5 mock appointments visible in dashboard
7. Click any patient → see full clinical dashboard with mock data
8. All features work normally

**Expected:**
- "Demo Mode" badge visible
- Mock patient data realistic
- Mock FHIR data displays correctly
- No error messages

---

### Scenario 3: Recovery from Offline
**Goal:** Test seamless switch from mock → real data

**Steps:**
1. Frontend running without backend (mock mode active)
2. Verify "Demo Mode" badge visible
3. Start Django backend: `python manage.py runserver`
4. Click bell icon to refresh appointments
5. Backend now reachable
6. "Demo Mode" badge disappears
7. Switches to real data (if any exists)

**Expected:**
- Badge disappears automatically
- Real data loads
- No page reload required
- Smooth transition

---

## 🔍 Verification Checklist

### Real Data Mode
- [ ] Backend running on `http://localhost:8000`
- [ ] Test patients created via seed command
- [ ] No "Demo Mode" badge in header
- [ ] Appointments appear in doctor dashboard
- [ ] Clinical data loads for selected patient
- [ ] Appointment updates every 10 seconds
- [ ] Bell icon shows appointment count

### Mock Data Mode
- [ ] "Demo Mode" badge visible (yellow, Wi-Fi off icon)
- [ ] 5 mock patients visible in sidebar
- [ ] 5 mock appointments in main panel
- [ ] Can select patient and view clinical data
- [ ] Mock FHIR data displays correctly
- [ ] UI fully functional for testing
- [ ] No console errors related to mock data

---

## 🛠️ Debugging

### Check if API is responding
**Browser Console (F12):**
```javascript
// Test fetch
fetch('http://localhost:8000/api/auth/appointments/', {
    headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
}).then(r => r.json()).then(d => console.log(d))

// Should see array of appointments or error
```

### Check mock data import
**Browser Console (F12):**
```javascript
// Check if imports worked
typeof mockPatients // Should be 'object'
typeof generateMockAppointments // Should be 'function'

// Generate mock appointments
generateMockAppointments() // Should show 5 appointments
```

### Check which mode is active
**Browser Console (F12):**
```javascript
// Check React state (if React DevTools installed)
// Or look for "Demo Mode" badge in UI
// Or check Network tab for API calls (should fail if backend down)
```

### Enable verbose logging
**DoctorDashboard.jsx:**
```javascript
// Modify fetchAppointments to log more
const fetchAppointments = async () => {
    console.log('🔄 Fetching appointments...');
    try {
        const response = await fetch(...);
        console.log('Response OK:', response.ok);
        console.log('Response data:', await response.json());
        // ... rest of function
    } catch (error) {
        console.error('❌ Fetch failed, using mock:', error);
    }
};
```

---

## 📋 Appointment Statuses

### Real Appointments
- `scheduled` - Confirmed appointment
- `completed` - Finished appointment
- `cancelled` - Cancelled by doctor/patient

### Mock Appointments
All mock appointments have status `scheduled` and realistic dates:
- Some in next 2-3 days (urgent/upcoming)
- Some in 5-7 days (future)
- Various reasons: checkups, follow-ups, assessments

---

## 🎨 UI Indicators

### Mock Data Mode Badge
**Location:** Top header, next to doctor name
**Style:** Yellow background with Wi-Fi off icon
**Text:** "Demo Mode"
**Visibility:** Only when `mockMode === true`

```html
<div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full">
    <WifiOff size={14} className="text-yellow-500" />
    <span className="text-xs font-medium text-yellow-500">Demo Mode</span>
</div>
```

### Appointment Bell Icon
**Location:** Top header right side
**Behavior:** 
- Shows count of appointments
- Pulses blue when appointments exist
- Click to manually refresh
- Real-time updates every 10 seconds

---

## 💡 Pro Tips

### For Development
1. **Use mock data first** to build UI without backend dependencies
2. **Test fallback logic** by intentionally breaking API calls
3. **Verify FHIR structure** matches real FHIR standard

### For Testing
1. **Use `seed_test_data` command** for consistent test data
2. **Test both modes:** Real backend + Mock offline
3. **Check Network tab** (F12) to see API calls
4. **Check Console** for errors and logs

### For Deployment
1. **Mock data is read-only** - safe for production
2. **No API calls to mock** - won't timeout
3. **Graceful degradation** - system works even if FHIR down
4. **Zero data loss** - mock data doesn't modify database

---

## 📞 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| No patients in sidebar | Backend offline OR empty DB | Check if backend running, or verify mock mode active |
| "Demo Mode" always showing | API returning error | Check Django logs: `python manage.py runserver` |
| Appointments not updating | Polling interval issue | Click bell icon to manually refresh |
| Mock data not displaying | Import error | Check `frontend/src/mockData.js` exists |
| Status colors wrong | CSS issue | Verify Tailwind styles in DoctorDashboard |
| Can't select patient | Patient ID mismatch | Verify patient ID format matches mock data |

---

## 🚀 Next Steps

### After Testing
1. **Integrate with real FHIR server** when available
2. **Remove mock data dependency** (keep as fallback)
3. **Add persistent storage** for test data
4. **Implement real appointment notifications** (email, SMS)
5. **Add appointment action buttons** (confirm, reschedule, cancel)

### Production Deployment
1. Keep mock data fallback **enabled**
2. Configure FHIR server URL in settings
3. Test failover scenario (FHIR down)
4. Monitor API response times
5. Log appointment sync events

---

**System is ready for comprehensive testing!** 🎉

Use real backend for production testing, use mock data for offline development. Best of both worlds! 💪
