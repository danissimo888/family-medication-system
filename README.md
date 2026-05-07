# MedFamily — Family Medication Management System

A web platform for families managing chronic conditions like Diabetes and Hypertension. Patients track prescriptions and doses, caregivers monitor adherence remotely, and the system enforces drug interaction and allergy safety checks before every dose.

## Features

- Three user roles: Patient, Caregiver, Admin
- Prescription and schedule management
- Dose logging with adherence tracking
- Drug-drug interaction detection at administration time
- Allergy safety checks before dose confirmation
- Real-time notifications and dose reminders
- Caregiver notes for patient monitoring
- Full audit trail of all system mutations
- Family-scoped data isolation
- Role-based access control (RBAC)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express (MVC) |
| Frontend | Vanilla HTML/CSS/JS + Bootstrap 5 |
| Database | PostgreSQL via Supabase |
| Auth | JWT (HS256) + bcryptjs |
| Security | Helmet, CORS, rate limiting, CSP |
| Deployment | Vercel (serverless) |

## Project Structure

```
src/
  server.js                # Express entry point, middleware stack
  config/supabase.js       # Supabase client initialization
  middleware/              # auth, role, audit, validation, error handling
  controllers/             # Route handlers (thin — delegate to services)
  services/                # Business logic (safety checks, scheduling, adherence)
  models/                  # Database queries (one file per domain)
  routes/                  # Express routers (one file per domain)
public/
  index.html               # Landing page
  css/styles.css           # Custom styles
  js/                      # Page-specific scripts
  pages/                   # HTML pages (dashboard, login, register, etc.)
supabase/
  migrations/              # 26 SQL migration files
```

## Setup

### Prerequisites

- Node.js 18+
- A Supabase project with migrations applied

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key
JWT_SECRET=your_secret_min_32_chars
PORT=3000
```

### Run Locally

```bash
npm start
```

The app serves at `http://localhost:3000`.

## API Endpoints

All endpoints prefixed with `/api`. Auth endpoints are public; all others require `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login, returns JWT |
| GET | /api/auth/me | Get current user |
| GET | /api/patients | List patients (family-scoped) |
| GET | /api/medications | List medications |
| POST | /api/prescriptions | Create prescription (safety checked) |
| GET | /api/patients/:pid/schedules | Get patient schedules |
| POST | /api/administration-records | Log a dose |
| GET | /api/notifications | Get user notifications |
| GET | /api/audit-logs | View audit trail (admin) |
| GET | /api/health | Health check |

## Database

15 normalized PostgreSQL tables with foreign key dependencies:

`roles → families → users → patients → chronic_conditions → medications → prescriptions → prescription_items → medication_schedules → administration_records → patient_allergies → drug_interactions → notifications → caregiver_notes → audit_logs`

Migrations are in `supabase/migrations/` and must be applied in order.

## User Roles

| Role | Capabilities |
|------|-------------|
| Patient | View own schedule, log doses, manage conditions/allergies |
| Caregiver | Monitor all family patients, log doses on their behalf, create prescriptions, add notes |
| Admin | Manage users, medication catalog, drug interactions, view audit logs |

## Deployment (Vercel)

1. Push code to GitHub
2. Import repository on vercel.com
3. Set Framework Preset to "Other"
4. Add environment variables (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, JWT_SECRET, NODE_ENV=production)
5. Deploy
6. Set ALLOWED_ORIGINS to your Vercel domain after first deploy

## Author

Deniz Ahmed
