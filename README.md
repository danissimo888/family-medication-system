# Family Medication Management System

A web-based platform for families managing chronic conditions such as Diabetes and Hypertension. Patients can track prescriptions, schedules, and doses, while caregivers monitor adherence remotely. The system enforces drug-drug interaction and allergy safety checks at dose administration time.

## Tech Stack

- **Backend:** Node.js + Express (MVC architecture)
- **Frontend:** Vanilla HTML/CSS/JS + Bootstrap 5
- **Database:** Supabase (managed PostgreSQL)
- **Auth:** JWT (HS256) with bcryptjs
- **Deployment:** Vercel (serverless)

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
JWT_SECRET=your_jwt_secret
PORT=3000
```

### Run

```bash
npm start
```

## Project Structure

```
src/
  server.js              # Express entry point
  config/supabase.js     # Supabase client init
  middleware/             # auth, role, audit middleware
  controllers/           # Route handlers
  services/              # Business logic
  models/                # Supabase queries
  routes/                # Express routers
public/
  index.html             # Landing page
  css/styles.css         # Custom styles
  js/                    # Page scripts
  pages/                 # HTML pages
```

## User Roles

- **Patient** — Views schedule, logs doses, manages conditions/allergies
- **Caregiver** — Monitors family patients, logs doses on their behalf, creates prescriptions
- **Admin** — Manages users, medication catalog, drug interactions, audit logs

## Author

Deniz Ahmed
