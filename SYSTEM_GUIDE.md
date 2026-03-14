# Cerebro Medical Dashboard System - Complete Setup Guide

## 🎯 System Overview

Cerebro is a modern, HIPAA-compliant medical dashboard system built with:
- **Frontend**: React 19 with Vite, React Router, Framer Motion, Lucide icons
- **Backend**: Django REST Framework with JWT authentication
- **Database**: SQLite (configurable to PostgreSQL for production)

---

## 📋 Features Implemented

### Authentication & Authorization
✅ User registration with role selection (Doctor/Patient)
✅ Email-based login with JWT tokens
✅ Automatic token refresh mechanism
✅ Role-based routing (automatic redirect to appropriate dashboard)
✅ Protected routes with role-based access control

### Patient Dashboard
✅ **Overview Tab**
- Personal profile information
- Quick statistics (appointments, doctors, allergies)
- Upcoming appointments preview
- Notification alerts for appointments within 2 days

✅ **Appointments Tab**
- View all appointments (scheduled/completed/cancelled)
- Book new appointments with doctors
- See appointment details (doctor, time, duration)

✅ **My Doctors Tab**
- View all linked doctors with specialties
- Quick appointment booking from doctor card
- Add new doctors to provider list

✅ **Medical Records Tab**
- View and manage allergies with severity levels
- Medical history (chronic conditions, surgeries, medications)
- Family history records
- Insurance information
- Advance directives

### Doctor Dashboard
✅ **Overview Tab**
- Profile with specialty and license information
- Today's appointment summary
- Upcoming consultations schedule
- Quick statistics

✅ **Appointments Tab**
- Today's schedule with patient names and times
- Upcoming appointments for next 7 days
- Appointment status tracking

✅ **My Patients Tab**
- List of linked patients with detailed view
- Patient contact information
- Access to patient medical records
- Patient information panel

### UI/UX Features
✅ Responsive sidebar navigation
✅ Smooth animations with Framer Motion
✅ Modern card-based design system
✅ Mobile-friendly layout
✅ Dark mode compatible styling
✅ Loading states and empty states
✅ Error handling with user feedback

---

## 🛠️ Backend API Endpoints

### Authentication Endpoints
```
POST   /api/auth/register/          - Create new account
POST   /api/auth/login/             - Sign in and get JWT tokens
GET    /api/auth/me/                - Get current user profile
POST   /api/auth/token/refresh/     - Refresh JWT token
```

### Appointment Endpoints
```
GET    /api/auth/appointments/                 - List user's appointments
POST   /api/auth/appointments/                 - Create new appointment
GET    /api/auth/appointments/today/           - Get today's appointments
GET    /api/auth/appointments/upcoming/        - Get next 7 days appointments
GET    /api/auth/appointments/notifications/  - Get appointments within 2 days
```

### Medical Records Endpoints
```
GET    /api/auth/allergies/                    - List allergies
POST   /api/auth/allergies/                    - Add new allergy
GET    /api/auth/medical-history/              - Get medical history
PUT    /api/auth/medical-history/              - Update medical history
GET    /api/auth/family-history/               - Get family history
PUT    /api/auth/family-history/               - Update family history
GET    /api/auth/insurance/                    - Get insurance info
PUT    /api/auth/insurance/                    - Update insurance
GET    /api/auth/advance-directive/            - Get advance directive
PUT    /api/auth/advance-directive/            - Update advance directive
```

### Encounter Endpoints
```
GET    /api/auth/encounters/        - List medical encounters
```

### Doctor/Patient Management
```
GET    /api/auth/doctors/           - List all doctors
POST   /api/auth/doctors/           - Add doctor to patient's list
GET    /api/auth/patients/          - List patients (for doctors only)
```

---

## 🗄️ Database Models

### User Model
```python
- id, email (unique), password
- first_name, last_name
- role: 'doctor' or 'patient'
- is_active, is_staff, is_superuser
- date_joined, last_login
```

### Doctor Profile
```python
- user (OneToOne)
- specialty: CharField (max 120)
- license_number: CharField (max 60)
```

### Patient Profile
```python
- user (OneToOne)
- date_of_birth: DateField
- phone_number: CharField (max 20)
- doctors: ManyToMany with User
```

### Appointment
```python
- patient, doctor (ForeignKeys)
- scheduled_at: DateTime
- duration_minutes: Int (default 30)
- status: 'scheduled', 'completed', 'cancelled'
- notes: TextField
```

### Medical Records Models
- **Allergy**: Allergen, reaction, severity level
- **MedicalHistory**: Chronic conditions, surgeries, medications
- **FamilyHistory**: Family medical conditions
- **Insurance**: Provider, policy number, effective/expiry dates
- **AdvanceDirective**: Healthcare proxy, document URL, notes
- **Encounter**: Medical consultation records

---

## 🚀 Running the System

### Start Backend (Django)
```bash
cd /path/to/cerebro
source venv/Scripts/activate  # or venv\Scripts\Activate.ps1 on Windows
python manage.py runserver
# Server runs on http://localhost:8000
```

### Start Frontend (React/Vite)
```bash
cd /path/to/cerebro/frontend
npm install  # if needed
npm run dev
# Dev server runs on http://localhost:5174
```

---

## 🔐 Security Features

✅ JWT authentication with refresh tokens
✅ CORS configuration for frontend/backend communication
✅ Role-based access control
✅ Protected routes on frontend and backend
✅ Password hashing with Django's default system
✅ CSRF protection on forms

---

## 📱 Responsive Design Breakpoints

- **Desktop**: Full sidebar navigation, multi-column layouts
- **Tablet (≤1024px)**: Optimized grid layouts
- **Mobile (≤768px)**: Hidden sidebar, collapsible navigation
- **Small Mobile (≤640px)**: Icons-only sidebar, single column layouts

---

## 🎨 Design System

The app uses CSS custom properties defined in `index.css`:
```css
--c-bg           /* Background color */
--c-surface      /* Surface color (cards) */
--c-surface-2    /* Secondary surface */
--c-surface-3    /* Tertiary surface */
--c-text         /* Primary text */
--c-text-2       /* Secondary text */
--c-text-3       /* Tertiary text */
--c-accent       /* Primary accent (blue) */
--c-border       /* Border color */
--radius-sm      /* Small border radius */
--radius-md      /* Medium border radius */
```

---

## 🧪 Testing the System

### Create Test Users
```bash
python manage.py shell
```

```python
from accounts.models import User

# Create doctor
doctor = User.objects.create_user(
    email='doctor@hospital.org',
    password='securepass123',
    first_name='John',
    last_name='Smith',
    role='doctor'
)

# Create patient
patient = User.objects.create_user(
    email='patient@example.com',
    password='securepass123',
    first_name='Jane',
    last_name='Doe',
    role='patient'
)
```

### Test API with cURL
```bash
# Register
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securepass123",
    "password2": "securepass123",
    "first_name": "Test",
    "last_name": "User",
    "role": "patient"
  }'

# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securepass123"
  }'
```

---

## 📚 Project Structure

```
cerebro/
├── manage.py
├── db.sqlite3
├── requirements.txt
├── accounts/
│   ├── models.py           # All database models
│   ├── serializers.py      # DRF serializers
│   ├── views.py            # API viewsets and views
│   ├── urls.py             # API routing
│   ├── migrations/
│   │   ├── 0001_initial.py
│   │   └── 0002_appointment_medicalrecord_...py
│   ├── admin.py
│   └── apps.py
├── cerebro/
│   ├── settings.py         # Django configuration
│   ├── urls.py             # Main URL configuration
│   ├── asgi.py
│   └── wsgi.py
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── src/
    │   ├── main.jsx         # React entry point
    │   ├── App.jsx          # Main app component with routing
    │   ├── AuthContext.jsx  # Authentication context
    │   ├── api.js           # Axios API client
    │   ├── index.css        # Design system & global styles
    │   ├── pages/
    │   │   ├── PatientDashboard.jsx
    │   │   └── DoctorDashboard.jsx
    │   ├── components/
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   ├── LandingPage.jsx
    │   │   ├── Viewer.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── layouts/
    │   │   └── Dashboard.css
    │   ├── hooks/
    │   ├── services/
    │   └── assets/
    └── public/
```

---

## 🔄 Data Flow

### User Registration Flow
1. User fills form on Signup page
2. Frontend sends POST to `/api/auth/register/`
3. Backend creates User + Profile (Doctor/Patient)
4. Backend returns tokens + user data
5. Frontend stores tokens in localStorage
6. Frontend redirects to appropriate dashboard `/doctor-dashboard` or `/patient-dashboard`

### Appointment Booking Flow
1. Patient navigates to Appointments tab
2. Clicks "Book Appointment"
3. Selects doctor and time
4. Frontend sends POST to `/api/auth/appointments/`
5. Backend creates Appointment record
6. Frontend updates appointment list

### Medical Record Access Flow
1. Patient views Medical Records tab
2. Frontend fetches allergies, history via GET requests
3. Components display data in organized sections
4. User can update records via PUT requests

---

## 🚀 Next Steps & Enhancements

### Available to Implement
- [ ] Real-time notifications with WebSockets
- [ ] File upload for medical records
- [ ] Email notifications for appointments
- [ ] Payment integration for consultations
- [ ] Video consultation feature
- [ ] Advanced patient search for doctors
- [ ] Analytics dashboard for doctors
- [ ] Bulk appointment scheduling
- [ ] SMS notifications
- [ ] Two-factor authentication

### Deployment
- Configure for PostgreSQL database
- Set up environment variables
- Deploy frontend to Vercel/Netlify
- Deploy backend to Heroku/AWS/DigitalOcean
- Set up SSL/TLS certificates
- Configure production CORS settings

---

## 📞 Support & Debugging

### Common Issues

**CORS Error**: Make sure `localhost:5174` is in `CEREBRO_SETTINGS.CORS_ALLOWED_ORIGINS`

**Token Expired**: Check localStorage for tokens, ensure refresh endpoint is configured

**Database Error**: Run `python manage.py migrate` to apply all migrations

**Port Already in Use**: 
- Django: `python manage.py runserver 8001`
- Vite: `npm run dev -- --port 5175`

---

## 📄 License

This project is built for the Cerebro medical platform.

---

🎉 **You now have a fully functional medical dashboard system ready for development and testing!**
