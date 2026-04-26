# 🚀 Quick Start - Doctor Dashboard with Mock Data

## Step 1: Create Test Patients

Open a terminal in the `cerebro-main` directory and run:

```bash
python manage.py seed_test_data
```

**Output:**
```
Found doctor: Dr. Test User
✓ Created patient: John Doe (john.doe@patient.com)
✓ Created patient: Jane Smith (jane.smith@patient.com)
✓ Created patient: Robert Johnson (robert.johnson@patient.com)
✓ Created patient: Emily Williams (emily.williams@patient.com)
✓ Created patient: Michael Brown (michael.brown@patient.com)

✓ Successfully created 5 test patients
✓ All patients assigned to Dr. Test User

Test patient credentials:
  Email: john.doe@patient.com, Password: testpass123
  Email: jane.smith@patient.com, Password: testpass123
  Email: robert.johnson@patient.com, Password: testpass123
  Email: emily.williams@patient.com, Password: testpass123
  Email: michael.brown@patient.com, Password: testpass123
```

## Step 2: Login as Doctor

1. Go to http://localhost:5176 (or your frontend URL)
2. **Login** with your doctor account
3. You'll see **5 assigned patients** in the left sidebar

## Step 3: Test Appointments (Two Browser Windows)

### Window 1: Doctor Dashboard
1. **Keep logged in** as doctor
2. Watch the "Upcoming Appointments" panel
3. Notice: **Bell icon in top-right** shows appointment count

### Window 2: Patient Dashboard
1. Open browser incognito or different browser
2. **Login as patient**: john.doe@patient.com / testpass123
3. Go to **Consultations/Appointments tab**
4. Request appointment with your doctor
5. Select date/time and confirm

### Back to Window 1: Doctor Dashboard
✅ **New appointment appears automatically** (refreshes every 10 seconds)
- View in right panel under "Upcoming Appointments"
- Click patient to see their clinical record + appointment details

## 🔄 Real-Time Updates

- **Automatic refresh:** Every 10 seconds
- **Manual refresh:** Click bell icon 🔔 in top-right header
- **Patient selection:** Loads full FHIR clinical data + appointments

## 🧪 Testing Checklist

- [x] Run seed command
- [x] See 5 patients in sidebar
- [x] Login as patient in another browser
- [x] Request appointment as patient
- [x] See appointment appear as doctor (auto-refreshes)
- [x] Click patient → view clinical dashboard
- [x] See appointment in clinical dashboard

## 🔑 Quick Commands

```bash
# Create test data (default: doctor@test.com)
python manage.py seed_test_data

# Create test data for specific doctor email
python manage.py seed_test_data --doctor-email your-email@example.com

# Reset and recreate (WARNING: deletes all test data first)
# This deletes old test data and creates fresh ones
python manage.py seed_test_data
```

## 📍 Patient Account Details

All created with password: **testpass123**

| Name | Email |
|------|-------|
| John Doe | john.doe@patient.com |
| Jane Smith | jane.smith@patient.com |
| Robert Johnson | robert.johnson@patient.com |
| Emily Williams | emily.williams@patient.com |
| Michael Brown | michael.brown@patient.com |

## ⚡ Features Verified

✅ Doctor Dashboard displays assigned patients
✅ Appointments auto-refresh every 10 seconds  
✅ Bell notification shows appointment count
✅ Click patient → clinical dashboard loads
✅ FHIR data: conditions, medications, allergies, vitals, labs
✅ Appointments panel shows patient-specific bookings
✅ Can add/assign more patients via "Add Patient" button

## 🐛 Troubleshooting

**Patients not showing in sidebar?**
- Refresh page (Ctrl+R)
- Check browser console (F12 → Console)
- Verify seed command ran successfully

**Appointments not appearing?**
- Click bell icon to manually refresh
- Refresh page
- Check both doctor and patient are logged in correctly

**Clinical data not loading?**
- FHIR server is optional (graceful fallback)
- Local data should still load
- Check network tab for API errors (F12 → Network)

---

✨ **System is ready for testing!** Enjoy the clinical dashboard 🏥
