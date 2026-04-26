# ✅ Doctor Dashboard - Setup Guide

## 🎯 Generate Test Data

Run this command to create 5 test patients and assign them to your doctor account:

```bash
# From the cerebro-main directory (where manage.py is located)
python manage.py seed_test_data --doctor-email your-doctor-email@example.com
```

**Default (if no email provided):**
```bash
python manage.py seed_test_data
# Creates test patients assigned to doctor@test.com
```

## 📋 Test Patient Credentials

After running the command, you'll get test patients with:
- **Password for all test patients:** `testpass123`
- **Emails:**
  - john.doe@patient.com
  - jane.smith@patient.com
  - robert.johnson@patient.com
  - emily.williams@patient.com
  - michael.brown@patient.com

## 🔄 How Appointments Work

### Patient Side (Login as Patient)
1. Login with patient email + `testpass123`
2. Go to Patient Dashboard
3. Find a doctor in "Book Appointment" section
4. Click to create appointment
5. Select date/time and confirm

### Doctor Side (Auto-Updates)
1. Appointments appear automatically in the Doctor Dashboard
2. **Appointments refresh every 10 seconds** - new bookings appear in real-time
3. Bell icon in header shows notification when appointments exist
4. Click bell icon to manually refresh

## 📍 Where to See Appointments

**In Main Dashboard:**
- Right side panel shows "Upcoming Appointments"
- Updates every 10 seconds automatically

**When Patient Selected:**
- Bottom appointments panel shows all appointments for that patient
- Status: scheduled, completed, or cancelled

## 🧪 Test Flow

1. **Seed test data:**
   ```bash
   python manage.py seed_test_data --doctor-email your-email@example.com
   ```

2. **Login as doctor** → See assigned patients in sidebar

3. **Open new browser/incognito** → Login as test patient
   - Email: john.doe@patient.com
   - Password: testpass123

4. **Patient creates appointment** → Doctor sees it in real-time

5. **Doctor clicks patient** → Views full clinical record + patient's appointments

## ⚙️ Real-Time Updates

- Appointments auto-refresh: **Every 10 seconds**
- Manual refresh: Click **Bell icon** in top-right
- Polling stops when page unloads (cleanup handled)

## 🔐 Notes

- Test patient passwords are all: `testpass123`
- Patients are automatically assigned to the doctor
- All FHIR data (conditions, meds, allergies) still works with test data
- Appointments show in both doctor and patient dashboards

---

**Troubleshooting:**
- If appointments don't show, click refresh (bell icon)
- Check browser console for errors (F12 → Console)
- Ensure both doctor and patient are logged in correctly
