# Cerebro — Intelligent Radiology Platform

An enterprise-grade radiology platform connecting physicians and patients through a unified DICOM workspace, structured reporting, and AI-assisted diagnostics.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite, React Router, Framer Motion, Lucide React |
| Backend | Django (Python) |
| Styling | Vanilla CSS (design system in `index.css`) |

## Project Structure

```
cerebro/
├── cerebro/          # Django project settings
├── frontend/         # React/Vite frontend
│   └── src/
│       └── components/
│           ├── LandingPage.jsx
│           ├── Login.jsx
│           ├── Signup.jsx
│           ├── Dashboard.jsx
│           └── Viewer.jsx
├── manage.py
└── venv/             # (not committed)
```

## Getting Started

### Backend
```bash
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`, Django on `http://localhost:8000`.

## Features

- **Landing Page** — Professional hero, feature grid, CTA section with real medical photography
- **Authentication** — Doctor / Patient role-based login & signup
- **Doctor Dashboard** — Stat cards, recent studies table with status tracking
- **DICOM Viewer** — Medical imaging viewer (in progress)

## Team

Cerebro Technologies — University Project
