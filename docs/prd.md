# Project Requirements Document (PRD)

## Online Family Chronic Disease Medication Management System Based On Bootstrap

| Field             | Detail                                      |
| ----------------- | ------------------------------------------- |
| **Version**       | 1.0                                         |
| **Date**          | 2026-04-02                                  |
| **Project Type**  | Thesis / Capstone                           |
| **Author**        | Deniz Ahmed                                 |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Project Objectives](#3-project-objectives)
4. [User Personas and Stories](#4-user-personas-and-stories)
5. [System Architecture](#5-system-architecture)
6. [Database Schema](#6-database-schema)
7. [API Design](#7-api-design)
8. [Functional Requirements](#8-functional-requirements)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Security and Compliance](#10-security-and-compliance)
11. [Implementation Roadmap](#11-implementation-roadmap)

---

## 1. Executive Summary

This project delivers a **web-based medication management platform** designed for families managing chronic conditions such as Diabetes and Hypertension. It enables patients to track their prescriptions, schedules, and doses, while caregivers can monitor adherence remotely. The system enforces safety checks for drug-drug interactions and allergy conflicts at the point of dose administration.

The platform is built with a **Model-View-Controller (MVC)** architecture using Node.js/Express on the backend, vanilla HTML/CSS/JS with Bootstrap 5 on the frontend, and Supabase (PostgreSQL) as the database layer. The data model comprises **15 normalized relational tables** that cover the full lifecycle from patient registration through medication administration and audit logging.

---

## 2. Problem Statement

Families managing chronic illness face three recurring challenges:

1. **Fragmented medication tracking** — paper notes, memory, and disconnected apps lead to missed or duplicate doses.
2. **No caregiver visibility** — family members responsible for elderly or dependent patients have no centralized way to verify that medications were taken on time.
3. **Safety blind spots** — without clinical-grade interaction and allergy checks, dangerous drug combinations go undetected in a home setting.

This system addresses all three by providing a single, shared platform with built-in scheduling, logging, and automated safety validation.

---

## 3. Project Objectives

| #  | Objective                                                                 | Success Metric                                                       |
| -- | ------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| O1 | Digitize medication schedules for chronic disease patients                | Patient can create a schedule and receive reminders                   |
| O2 | Provide a shared caregiver view across a family unit                      | Caregiver can view adherence history for every linked patient         |
| O3 | Automate drug-drug interaction and allergy safety checks                  | System blocks or warns on every flagged combination before logging    |
| O4 | Maintain a tamper-evident audit trail of all medication events            | Every create/update/delete action is recorded in the Audit Logs table |
| O5 | Deliver a responsive, accessible UI suitable for elderly or low-tech users | Pages pass WCAG 2.1 AA contrast ratios; work on mobile viewports     |

---

## 4. User Personas and Stories

### 4.1 Personas

| Persona       | Description                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| **Patient**   | An individual with one or more chronic conditions who needs to take medications daily on a schedule.   |
| **Caregiver** | A family member (spouse, adult child, sibling) who monitors and assists one or more patients.         |
| **Admin**     | A system administrator who manages user accounts, roles, and system-wide reference data.              |

### 4.2 User Stories — Patient

| ID   | Story                                                                                                                                  | Priority |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| P-01 | As a Patient, I want to register an account and join my family group so that my data is linked to my family.                           | High     |
| P-02 | As a Patient, I want to add my chronic conditions so that the system can tailor safety checks.                                         | High     |
| P-03 | As a Patient, I want to view my active prescriptions and the medications within each prescription.                                     | High     |
| P-04 | As a Patient, I want to see my daily medication schedule so that I know what to take and when.                                         | High     |
| P-05 | As a Patient, I want to log a dose as "taken," "skipped," or "missed" so that my adherence is recorded.                               | High     |
| P-06 | As a Patient, I want to be warned if a new prescription conflicts with my existing medications or allergies before the dose is logged. | High     |
| P-07 | As a Patient, I want to record my known allergies so the system can flag dangerous prescriptions.                                      | Medium   |
| P-08 | As a Patient, I want to receive in-app notifications reminding me of upcoming doses.                                                   | Medium   |
| P-09 | As a Patient, I want to view my adherence history over time (weekly/monthly).                                                          | Medium   |
| P-10 | As a Patient, I want to update my profile and health information.                                                                      | Low      |

### 4.3 User Stories — Caregiver

| ID   | Story                                                                                                                               | Priority |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------- | -------- |
| C-01 | As a Caregiver, I want to see a dashboard listing all patients in my family so I can monitor everyone in one place.                 | High     |
| C-02 | As a Caregiver, I want to view a patient's daily schedule and see which doses were taken, missed, or skipped.                       | High     |
| C-03 | As a Caregiver, I want to log a dose on behalf of a patient I am responsible for.                                                   | High     |
| C-04 | As a Caregiver, I want to add notes about a patient's condition or behavior on a specific date.                                     | Medium   |
| C-05 | As a Caregiver, I want to receive notifications when a patient misses a scheduled dose.                                             | Medium   |
| C-06 | As a Caregiver, I want to view a patient's allergy list and active prescriptions.                                                   | Medium   |
| C-07 | As a Caregiver, I want to add a new prescription for a patient (subject to safety checks).                                          | Medium   |

### 4.4 User Stories — Admin

| ID   | Story                                                                                                       | Priority |
| ---- | ----------------------------------------------------------------------------------------------------------- | -------- |
| A-01 | As an Admin, I want to manage user accounts (activate, deactivate, assign roles).                           | High     |
| A-02 | As an Admin, I want to manage the master medications list (add, edit, deactivate).                          | High     |
| A-03 | As an Admin, I want to manage the drug interactions reference table.                                        | Medium   |
| A-04 | As an Admin, I want to view audit logs filtered by user, action type, or date range.                        | Medium   |

---

## 5. System Architecture

### 5.1 High-Level MVC Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       CLIENT (Browser)                          │
│  HTML5 / CSS3 / Bootstrap 5 / Vanilla JS                        │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐     │
│  │ Landing Page │  │  Dashboard   │  │  Caregiver Portal  │     │
│  └─────────────┘  └──────────────┘  └────────────────────┘     │
└──────────────────────────┬──────────────────────────────────────┘
                           │  HTTP / JSON (REST API)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVER (Node.js + Express)                    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  MIDDLEWARE LAYER                                         │   │
│  │  - cors / helmet / express-rate-limit                     │   │
│  │  - express.json() body parser                             │   │
│  │  - authMiddleware (JWT verification)                      │   │
│  │  - roleMiddleware (RBAC enforcement)                      │   │
│  │  - auditMiddleware (write Audit Log on mutations)         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────┐                                         │
│  │   CONTROLLERS       │  (Route handlers — thin; delegate      │
│  │   /controllers      │   to services)                         │
│  ├────────────────────┤                                         │
│  │ authController      │  register, login, refresh, logout      │
│  │ familyController    │  CRUD families, invite members         │
│  │ patientController   │  CRUD patient profiles, conditions     │
│  │ medicationController│  CRUD master medication catalog        │
│  │ prescriptionController│ CRUD prescriptions + items           │
│  │ scheduleController  │  CRUD schedules, generate daily view   │
│  │ adminController     │  dose logging, adherence stats         │
│  │ allergyController   │  CRUD patient allergies                │
│  │ interactionController│ drug interaction lookup               │
│  │ notificationController│ list / mark-read notifications       │
│  │ noteController      │  CRUD caregiver notes                  │
│  │ auditController     │  query audit logs (admin only)         │
│  └────────────────────┘                                         │
│                                                                 │
│  ┌────────────────────┐                                         │
│  │   SERVICES          │  (Business logic — safety checks,      │
│  │   /services         │   schedule generation, notifications)  │
│  └────────────────────┘                                         │
│                                                                 │
│  ┌────────────────────┐                                         │
│  │   MODELS            │  (Supabase client queries — one file   │
│  │   /models           │   per table or domain aggregate)       │
│  └────────────────────┘                                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │  Supabase JS Client (@supabase/supabase-js)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              SUPABASE (Managed PostgreSQL)                       │
│  15 Tables  ·  Row-Level Security Policies  ·  Realtime         │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 MVC Request Flow (Example: Log a Dose)

```
1. User clicks "Mark as Taken" in the browser.
2. JS sends POST /api/administration-records with { schedule_id, status: "taken" }.
3. Express router matches the route → adminController.logDose().
4. Controller calls administrationService.recordDose().
5. Service layer:
   a. Fetches the schedule + prescription item → gets medication_id.
   b. Calls safetyService.checkInteractions(patient_id, medication_id).
   c. Calls safetyService.checkAllergies(patient_id, medication_id).
   d. If warnings exist → returns warnings to controller (HTTP 409).
   e. If safe → calls administrationModel.create(record).
   f. Calls notificationService.markDoseComplete(schedule_id).
   g. auditMiddleware writes a log row automatically.
6. Controller returns JSON response → browser updates the UI.
```

### 5.3 Folder Structure

```
family-medication-system/
├── docs/
│   └── prd.md
├── public/                     # Static frontend files (View layer)
│   ├── index.html              # Landing page
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── app.js              # Shared utilities, API helper, auth state
│   │   ├── landing.js
│   │   ├── dashboard.js
│   │   ├── caregiver.js
│   │   ├── schedule.js
│   │   ├── prescriptions.js
│   │   ├── allergies.js
│   │   ├── notifications.js
│   │   └── admin.js
│   └── pages/
│       ├── login.html
│       ├── register.html
│       ├── dashboard.html
│       ├── caregiver.html
│       ├── schedule.html
│       ├── prescriptions.html
│       ├── allergies.html
│       ├── notifications.html
│       └── admin.html
├── src/
│   ├── server.js               # Express app entry point
│   ├── config/
│   │   └── supabase.js         # Supabase client init
│   ├── middleware/
│   │   ├── auth.js             # JWT verification
│   │   ├── role.js             # RBAC enforcement
│   │   └── audit.js            # Auto audit-log on mutations
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── familyController.js
│   │   ├── patientController.js
│   │   ├── medicationController.js
│   │   ├── prescriptionController.js
│   │   ├── scheduleController.js
│   │   ├── administrationController.js
│   │   ├── allergyController.js
│   │   ├── interactionController.js
│   │   ├── notificationController.js
│   │   ├── noteController.js
│   │   └── auditController.js
│   ├── services/
│   │   ├── safetyService.js    # Interaction + allergy checks
│   │   ├── scheduleService.js  # Generate daily view
│   │   ├── notificationService.js
│   │   └── adherenceService.js # Compute adherence stats
│   ├── models/
│   │   ├── userModel.js
│   │   ├── familyModel.js
│   │   ├── patientModel.js
│   │   ├── medicationModel.js
│   │   ├── prescriptionModel.js
│   │   ├── scheduleModel.js
│   │   ├── administrationModel.js
│   │   ├── allergyModel.js
│   │   ├── interactionModel.js
│   │   ├── notificationModel.js
│   │   ├── noteModel.js
│   │   └── auditModel.js
│   └── routes/
│       ├── authRoutes.js
│       ├── familyRoutes.js
│       ├── patientRoutes.js
│       ├── medicationRoutes.js
│       ├── prescriptionRoutes.js
│       ├── scheduleRoutes.js
│       ├── administrationRoutes.js
│       ├── allergyRoutes.js
│       ├── interactionRoutes.js
│       ├── notificationRoutes.js
│       ├── noteRoutes.js
│       └── auditRoutes.js
├── .env                        # SUPABASE_URL, SUPABASE_KEY, JWT_SECRET
├── .gitignore
├── package.json
├── vercel.json                 # Vercel deployment config
└── README.md
```

---

## 6. Database Schema

### 6.1 Entity-Relationship Overview

```
Users ──┬── Roles (FK: role_id)
        │
        ├── Families (FK: family_id)
        │       │
        │       └── Patients (FK: family_id, user_id)
        │               │
        │               ├── Chronic Conditions (FK: patient_id)
        │               ├── Patient Allergies (FK: patient_id)
        │               ├── Prescriptions (FK: patient_id)
        │               │       │
        │               │       └── Prescription Items (FK: prescription_id, medication_id)
        │               │               │
        │               │               └── Medication Schedules (FK: prescription_item_id)
        │               │                       │
        │               │                       └── Administration Records (FK: schedule_id)
        │               │
        │               └── Caregiver Notes (FK: patient_id, caregiver_user_id)
        │
        ├── Notifications (FK: user_id)
        └── Audit Logs (FK: user_id)

Medications (standalone master table)
        │
        ├── Prescription Items (FK: medication_id)
        └── Drug Interactions (FK: medication_id_1, medication_id_2)
```

### 6.2 Table Definitions

Below is the full definition of each table. All tables include `created_at TIMESTAMPTZ DEFAULT NOW()`. Primary keys use `UUID DEFAULT gen_random_uuid()` unless noted.

---

#### Table 1: `roles`

Lookup table for RBAC.

| Column     | Type         | Constraints               |
| ---------- | ------------ | ------------------------- |
| id         | UUID         | PK, DEFAULT gen_random_uuid() |
| name       | VARCHAR(50)  | UNIQUE, NOT NULL          |
| description| TEXT         |                           |
| created_at | TIMESTAMPTZ  | DEFAULT NOW()             |

**Seed data:** `patient`, `caregiver`, `admin`.

---

#### Table 2: `users`

Every person who logs in.

| Column        | Type         | Constraints                       |
| ------------- | ------------ | --------------------------------- |
| id            | UUID         | PK, DEFAULT gen_random_uuid()     |
| role_id       | UUID         | FK → roles.id, NOT NULL           |
| family_id     | UUID         | FK → families.id, NULLABLE        |
| email         | VARCHAR(255) | UNIQUE, NOT NULL                  |
| password_hash | VARCHAR(255) | NOT NULL                          |
| first_name    | VARCHAR(100) | NOT NULL                          |
| last_name     | VARCHAR(100) | NOT NULL                          |
| phone         | VARCHAR(20)  |                                   |
| is_active     | BOOLEAN      | DEFAULT TRUE                      |
| last_login    | TIMESTAMPTZ  |                                   |
| created_at    | TIMESTAMPTZ  | DEFAULT NOW()                     |
| updated_at    | TIMESTAMPTZ  | DEFAULT NOW()                     |

---

#### Table 3: `families`

Grouping unit for multi-patient households.

| Column      | Type         | Constraints                   |
| ----------- | ------------ | ----------------------------- |
| id          | UUID         | PK, DEFAULT gen_random_uuid() |
| name        | VARCHAR(100) | NOT NULL                      |
| invite_code | VARCHAR(20)  | UNIQUE, NOT NULL              |
| created_by  | UUID         | FK → users.id, NOT NULL       |
| created_at  | TIMESTAMPTZ  | DEFAULT NOW()                 |
| updated_at  | TIMESTAMPTZ  | DEFAULT NOW()                 |

**Note:** `invite_code` is a short alphanumeric string a family creator shares with relatives so they can join the same family group during registration.

---

#### Table 4: `patients`

Health-specific profile linked to a user. A user with role `patient` has exactly one row here; a caregiver has zero.

| Column          | Type          | Constraints                   |
| --------------- | ------------- | ----------------------------- |
| id              | UUID          | PK, DEFAULT gen_random_uuid() |
| user_id         | UUID          | FK → users.id, UNIQUE, NOT NULL |
| family_id       | UUID          | FK → families.id, NOT NULL    |
| date_of_birth   | DATE          | NOT NULL                      |
| gender          | VARCHAR(20)   |                               |
| blood_type      | VARCHAR(5)    |                               |
| emergency_contact| VARCHAR(255) |                               |
| notes           | TEXT          |                               |
| created_at      | TIMESTAMPTZ   | DEFAULT NOW()                 |
| updated_at      | TIMESTAMPTZ   | DEFAULT NOW()                 |

---

#### Table 5: `chronic_conditions`

Conditions diagnosed for a patient.

| Column        | Type         | Constraints                   |
| ------------- | ------------ | ----------------------------- |
| id            | UUID         | PK, DEFAULT gen_random_uuid() |
| patient_id    | UUID         | FK → patients.id, NOT NULL    |
| condition_name| VARCHAR(150) | NOT NULL                      |
| diagnosed_date| DATE         |                               |
| severity      | VARCHAR(20)  | CHECK (severity IN ('mild','moderate','severe')) |
| status        | VARCHAR(20)  | DEFAULT 'active', CHECK (status IN ('active','in_remission','resolved')) |
| notes         | TEXT         |                               |
| created_at    | TIMESTAMPTZ  | DEFAULT NOW()                 |

---

#### Table 6: `medications`

Master catalog of drugs (system-wide, not patient-specific).

| Column          | Type          | Constraints                   |
| --------------- | ------------- | ----------------------------- |
| id              | UUID          | PK, DEFAULT gen_random_uuid() |
| generic_name    | VARCHAR(200)  | NOT NULL                      |
| brand_name      | VARCHAR(200)  |                               |
| dosage_form     | VARCHAR(50)   | NOT NULL (e.g., tablet, capsule, injection) |
| strength        | VARCHAR(50)   | NOT NULL (e.g., "500 mg")     |
| manufacturer    | VARCHAR(200)  |                               |
| description     | TEXT          |                               |
| side_effects    | TEXT          |                               |
| is_active       | BOOLEAN       | DEFAULT TRUE                  |
| created_at      | TIMESTAMPTZ   | DEFAULT NOW()                 |

---

#### Table 7: `prescriptions`

A prescription written for a patient (may contain multiple items).

| Column          | Type          | Constraints                   |
| --------------- | ------------- | ----------------------------- |
| id              | UUID          | PK, DEFAULT gen_random_uuid() |
| patient_id      | UUID          | FK → patients.id, NOT NULL    |
| prescribed_by   | VARCHAR(200)  | NOT NULL (doctor's name)      |
| prescribed_date | DATE          | NOT NULL                      |
| start_date      | DATE          | NOT NULL                      |
| end_date        | DATE          |                               |
| status          | VARCHAR(20)   | DEFAULT 'active', CHECK (status IN ('active','completed','cancelled')) |
| notes           | TEXT          |                               |
| created_at      | TIMESTAMPTZ   | DEFAULT NOW()                 |
| updated_at      | TIMESTAMPTZ   | DEFAULT NOW()                 |

---

#### Table 8: `prescription_items`

Individual line items within a prescription.

| Column            | Type          | Constraints                          |
| ----------------- | ------------- | ------------------------------------ |
| id                | UUID          | PK, DEFAULT gen_random_uuid()        |
| prescription_id   | UUID          | FK → prescriptions.id, NOT NULL      |
| medication_id     | UUID          | FK → medications.id, NOT NULL        |
| dosage            | VARCHAR(100)  | NOT NULL (e.g., "1 tablet")          |
| frequency         | VARCHAR(100)  | NOT NULL (e.g., "twice daily")       |
| duration_days     | INTEGER       |                                      |
| instructions      | TEXT          | (e.g., "take with food")            |
| created_at        | TIMESTAMPTZ   | DEFAULT NOW()                        |

**Composite unique:** (`prescription_id`, `medication_id`) — a prescription should not list the same drug twice.

---

#### Table 9: `medication_schedules`

Concrete time-slots generated from prescription items.

| Column               | Type          | Constraints                          |
| -------------------- | ------------- | ------------------------------------ |
| id                   | UUID          | PK, DEFAULT gen_random_uuid()        |
| prescription_item_id | UUID          | FK → prescription_items.id, NOT NULL |
| patient_id           | UUID          | FK → patients.id, NOT NULL           |
| scheduled_date       | DATE          | NOT NULL                             |
| scheduled_time       | TIME          | NOT NULL                             |
| status               | VARCHAR(20)   | DEFAULT 'pending', CHECK (status IN ('pending','taken','skipped','missed')) |
| created_at           | TIMESTAMPTZ   | DEFAULT NOW()                        |
| updated_at           | TIMESTAMPTZ   | DEFAULT NOW()                        |

**Index:** (`patient_id`, `scheduled_date`) for fast daily-view queries.

---

#### Table 10: `administration_records`

Immutable log of every dose event.

| Column         | Type          | Constraints                          |
| -------------- | ------------- | ------------------------------------ |
| id             | UUID          | PK, DEFAULT gen_random_uuid()        |
| schedule_id    | UUID          | FK → medication_schedules.id, NOT NULL |
| administered_by| UUID          | FK → users.id, NOT NULL (patient or caregiver) |
| status         | VARCHAR(20)   | NOT NULL, CHECK (status IN ('taken','skipped','missed')) |
| administered_at| TIMESTAMPTZ   | DEFAULT NOW()                        |
| notes          | TEXT          |                                      |
| created_at     | TIMESTAMPTZ   | DEFAULT NOW()                        |

---

#### Table 11: `patient_allergies`

Known allergies for a patient (drug or substance).

| Column        | Type          | Constraints                          |
| ------------- | ------------- | ------------------------------------ |
| id            | UUID          | PK, DEFAULT gen_random_uuid()        |
| patient_id    | UUID          | FK → patients.id, NOT NULL           |
| allergen_name | VARCHAR(200)  | NOT NULL                             |
| medication_id | UUID          | FK → medications.id, NULLABLE        |
| severity      | VARCHAR(20)   | CHECK (severity IN ('mild','moderate','severe','life_threatening')) |
| reaction      | TEXT          |                                      |
| created_at    | TIMESTAMPTZ   | DEFAULT NOW()                        |

**Note:** If `medication_id` is set, the system can automatically flag any prescription containing that medication. If only `allergen_name` is set, the check is manual/informational.

---

#### Table 12: `drug_interactions`

Pairs of medications that should not be taken together.

| Column           | Type          | Constraints                          |
| ---------------- | ------------- | ------------------------------------ |
| id               | UUID          | PK, DEFAULT gen_random_uuid()        |
| medication_id_1  | UUID          | FK → medications.id, NOT NULL        |
| medication_id_2  | UUID          | FK → medications.id, NOT NULL        |
| severity         | VARCHAR(20)   | NOT NULL, CHECK (severity IN ('minor','moderate','major','contraindicated')) |
| description      | TEXT          | NOT NULL                             |
| created_at       | TIMESTAMPTZ   | DEFAULT NOW()                        |

**Constraint:** CHECK (`medication_id_1 < medication_id_2`) — prevents duplicate pairs in reverse order.
**Composite unique:** (`medication_id_1`, `medication_id_2`).

---

#### Table 13: `notifications`

In-app notification queue.

| Column      | Type          | Constraints                          |
| ----------- | ------------- | ------------------------------------ |
| id          | UUID          | PK, DEFAULT gen_random_uuid()        |
| user_id     | UUID          | FK → users.id, NOT NULL              |
| title       | VARCHAR(200)  | NOT NULL                             |
| message     | TEXT          | NOT NULL                             |
| type        | VARCHAR(50)   | NOT NULL (e.g., 'reminder', 'missed_dose', 'interaction_warning', 'system') |
| is_read     | BOOLEAN       | DEFAULT FALSE                        |
| reference_id| UUID          | NULLABLE (generic FK to related entity) |
| created_at  | TIMESTAMPTZ   | DEFAULT NOW()                        |

**Index:** (`user_id`, `is_read`, `created_at DESC`) for the notification bell query.

---

#### Table 14: `caregiver_notes`

Free-text observations by a caregiver about a patient.

| Column            | Type          | Constraints                          |
| ----------------- | ------------- | ------------------------------------ |
| id                | UUID          | PK, DEFAULT gen_random_uuid()        |
| patient_id        | UUID          | FK → patients.id, NOT NULL           |
| caregiver_user_id | UUID          | FK → users.id, NOT NULL              |
| note_date         | DATE          | NOT NULL, DEFAULT CURRENT_DATE       |
| content           | TEXT          | NOT NULL                             |
| created_at        | TIMESTAMPTZ   | DEFAULT NOW()                        |
| updated_at        | TIMESTAMPTZ   | DEFAULT NOW()                        |

---

#### Table 15: `audit_logs`

Append-only log of every state-changing action.

| Column       | Type          | Constraints                          |
| ------------ | ------------- | ------------------------------------ |
| id           | UUID          | PK, DEFAULT gen_random_uuid()        |
| user_id      | UUID          | FK → users.id, NULLABLE (system events have no user) |
| action       | VARCHAR(50)   | NOT NULL (e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN') |
| table_name   | VARCHAR(100)  | NOT NULL                             |
| record_id    | UUID          | NOT NULL                             |
| old_values   | JSONB         |                                      |
| new_values   | JSONB         |                                      |
| ip_address   | VARCHAR(45)   |                                      |
| created_at   | TIMESTAMPTZ   | DEFAULT NOW()                        |

**Policy:** No UPDATE or DELETE allowed on this table — insert-only.

### 6.3 SQL Migration Script (Summary)

The full migration should be executed in Supabase's SQL Editor in the following order to respect FK dependencies:

```
1.  roles
2.  families
3.  users              (depends on roles, families)
4.  patients            (depends on users, families)
5.  chronic_conditions  (depends on patients)
6.  medications
7.  prescriptions       (depends on patients)
8.  prescription_items  (depends on prescriptions, medications)
9.  medication_schedules(depends on prescription_items, patients)
10. administration_records (depends on medication_schedules, users)
11. patient_allergies   (depends on patients, medications)
12. drug_interactions   (depends on medications)
13. notifications       (depends on users)
14. caregiver_notes     (depends on patients, users)
15. audit_logs          (depends on users)
```

---

## 7. API Design

All endpoints are prefixed with `/api`. Authenticated routes require the `Authorization: Bearer <token>` header.

### 7.1 Authentication

| Method | Endpoint             | Description              | Auth |
| ------ | -------------------- | ------------------------ | ---- |
| POST   | /api/auth/register   | Create a new user        | No   |
| POST   | /api/auth/login      | Authenticate, return JWT | No   |
| POST   | /api/auth/logout     | Invalidate session       | Yes  |
| GET    | /api/auth/me         | Get current user profile | Yes  |

**Request — POST /api/auth/register:**
```json
{
  "email": "maria@example.com",
  "password": "SecureP@ss1",
  "first_name": "Maria",
  "last_name": "Santos",
  "role": "patient",
  "family_invite_code": "ABC123"
}
```

**Response — POST /api/auth/login:**
```json
{
  "token": "eyJhbGciOi...",
  "user": {
    "id": "uuid",
    "email": "maria@example.com",
    "role": "patient",
    "family_id": "uuid"
  }
}
```

### 7.2 Families

| Method | Endpoint                     | Description                   | Auth  | Role        |
| ------ | ---------------------------- | ----------------------------- | ----- | ----------- |
| POST   | /api/families                | Create a new family           | Yes   | Any         |
| GET    | /api/families/:id            | Get family details + members  | Yes   | Family member |
| PUT    | /api/families/:id            | Update family name            | Yes   | Creator     |
| POST   | /api/families/join           | Join family via invite code   | Yes   | Any         |

### 7.3 Patients

| Method | Endpoint                              | Description                       | Auth | Role              |
| ------ | ------------------------------------- | --------------------------------- | ---- | ----------------- |
| GET    | /api/patients/:id                     | Get patient profile               | Yes  | Self / Caregiver  |
| PUT    | /api/patients/:id                     | Update patient profile            | Yes  | Self / Caregiver  |
| GET    | /api/patients/:id/conditions          | List chronic conditions           | Yes  | Self / Caregiver  |
| POST   | /api/patients/:id/conditions          | Add a chronic condition           | Yes  | Self / Caregiver  |
| PUT    | /api/patients/:id/conditions/:cid     | Update a condition                | Yes  | Self / Caregiver  |
| DELETE | /api/patients/:id/conditions/:cid     | Remove a condition                | Yes  | Self / Caregiver  |

### 7.4 Medications (Master Catalog)

| Method | Endpoint                  | Description                  | Auth | Role  |
| ------ | ------------------------- | ---------------------------- | ---- | ----- |
| GET    | /api/medications          | List all medications (search/filter) | Yes  | Any   |
| GET    | /api/medications/:id      | Get medication details       | Yes  | Any   |
| POST   | /api/medications          | Add a new medication         | Yes  | Admin |
| PUT    | /api/medications/:id      | Update medication            | Yes  | Admin |
| DELETE | /api/medications/:id      | Soft-delete medication       | Yes  | Admin |

### 7.5 Prescriptions

| Method | Endpoint                                           | Description                    | Auth | Role              |
| ------ | -------------------------------------------------- | ------------------------------ | ---- | ----------------- |
| GET    | /api/patients/:pid/prescriptions                   | List patient's prescriptions   | Yes  | Self / Caregiver  |
| POST   | /api/patients/:pid/prescriptions                   | Create prescription + items    | Yes  | Caregiver / Admin |
| GET    | /api/prescriptions/:id                             | Get prescription with items    | Yes  | Self / Caregiver  |
| PUT    | /api/prescriptions/:id                             | Update prescription            | Yes  | Caregiver / Admin |
| PUT    | /api/prescriptions/:id/cancel                      | Cancel a prescription          | Yes  | Caregiver / Admin |

**Request — POST /api/patients/:pid/prescriptions:**
```json
{
  "prescribed_by": "Dr. Reyes",
  "prescribed_date": "2026-04-01",
  "start_date": "2026-04-02",
  "end_date": "2026-07-02",
  "items": [
    {
      "medication_id": "uuid-of-metformin",
      "dosage": "1 tablet",
      "frequency": "twice daily",
      "duration_days": 90,
      "instructions": "Take with meals"
    }
  ]
}
```

**Safety check flow:** Before inserting, the server runs interaction and allergy checks on every `medication_id` in `items` against the patient's existing active prescriptions and allergies. If any flag is raised, the API returns:

```json
{
  "status": 409,
  "warnings": [
    {
      "type": "drug_interaction",
      "severity": "major",
      "medication_1": "Metformin 500mg",
      "medication_2": "Contrast Dye Agent",
      "description": "Increased risk of lactic acidosis."
    }
  ]
}
```

The frontend can display these warnings and let the user confirm or cancel.

### 7.6 Medication Schedules

| Method | Endpoint                                       | Description                          | Auth | Role              |
| ------ | ---------------------------------------------- | ------------------------------------ | ---- | ----------------- |
| GET    | /api/patients/:pid/schedules?date=YYYY-MM-DD   | Get daily schedule for a patient     | Yes  | Self / Caregiver  |
| GET    | /api/patients/:pid/schedules/weekly             | Get weekly schedule overview         | Yes  | Self / Caregiver  |
| POST   | /api/schedules/generate                         | Generate schedule from a prescription| Yes  | System / Caregiver|

### 7.7 Administration Records (Dose Logging)

| Method | Endpoint                                       | Description                     | Auth | Role              |
| ------ | ---------------------------------------------- | ------------------------------- | ---- | ----------------- |
| POST   | /api/administration-records                     | Log a dose (taken/skipped/missed)| Yes | Self / Caregiver  |
| GET    | /api/patients/:pid/administration-records       | Get dose history                | Yes  | Self / Caregiver  |
| GET    | /api/patients/:pid/adherence?period=30d         | Get adherence statistics        | Yes  | Self / Caregiver  |

**Request — POST /api/administration-records:**
```json
{
  "schedule_id": "uuid-of-schedule-slot",
  "status": "taken",
  "notes": "Taken 10 minutes late"
}
```

### 7.8 Patient Allergies

| Method | Endpoint                             | Description              | Auth | Role              |
| ------ | ------------------------------------ | ------------------------ | ---- | ----------------- |
| GET    | /api/patients/:pid/allergies         | List patient allergies   | Yes  | Self / Caregiver  |
| POST   | /api/patients/:pid/allergies         | Add an allergy           | Yes  | Self / Caregiver  |
| PUT    | /api/allergies/:id                   | Update allergy record    | Yes  | Self / Caregiver  |
| DELETE | /api/allergies/:id                   | Remove allergy           | Yes  | Self / Caregiver  |

### 7.9 Drug Interactions

| Method | Endpoint                                 | Description                                   | Auth | Role  |
| ------ | ---------------------------------------- | --------------------------------------------- | ---- | ----- |
| GET    | /api/interactions/check?meds=id1,id2,id3 | Check interactions among a set of medications  | Yes  | Any   |
| GET    | /api/interactions                        | List all interaction records                   | Yes  | Admin |
| POST   | /api/interactions                        | Add an interaction pair                        | Yes  | Admin |
| PUT    | /api/interactions/:id                    | Update interaction record                      | Yes  | Admin |
| DELETE | /api/interactions/:id                    | Delete interaction record                      | Yes  | Admin |

### 7.10 Notifications

| Method | Endpoint                          | Description                    | Auth | Role |
| ------ | --------------------------------- | ------------------------------ | ---- | ---- |
| GET    | /api/notifications                | List current user notifications| Yes  | Any  |
| PUT    | /api/notifications/:id/read       | Mark a notification as read   | Yes  | Any  |
| PUT    | /api/notifications/read-all       | Mark all as read              | Yes  | Any  |

### 7.11 Caregiver Notes

| Method | Endpoint                                  | Description               | Auth | Role      |
| ------ | ----------------------------------------- | ------------------------- | ---- | --------- |
| GET    | /api/patients/:pid/notes                  | List notes for a patient  | Yes  | Caregiver |
| POST   | /api/patients/:pid/notes                  | Add a note                | Yes  | Caregiver |
| PUT    | /api/notes/:id                            | Update a note             | Yes  | Author    |
| DELETE | /api/notes/:id                            | Delete a note             | Yes  | Author    |

### 7.12 Audit Logs (Admin Only)

| Method | Endpoint                                                        | Description          | Auth | Role  |
| ------ | --------------------------------------------------------------- | -------------------- | ---- | ----- |
| GET    | /api/audit-logs?user_id=&action=&table=&from=&to=&page=&limit= | Query audit logs     | Yes  | Admin |

### 7.13 Admin — User Management

| Method | Endpoint                       | Description                      | Auth | Role  |
| ------ | ------------------------------ | -------------------------------- | ---- | ----- |
| GET    | /api/admin/users               | List all users (paginated)       | Yes  | Admin |
| PUT    | /api/admin/users/:id/role      | Change a user's role             | Yes  | Admin |
| PUT    | /api/admin/users/:id/status    | Activate/deactivate a user       | Yes  | Admin |

---

## 8. Functional Requirements

### 8.1 Public Landing Page

| Req ID | Requirement                                                                |
| ------ | -------------------------------------------------------------------------- |
| FR-01  | Display a hero section describing the system's purpose.                    |
| FR-02  | Show feature highlights (scheduling, safety checks, caregiver monitoring). |
| FR-03  | Provide "Register" and "Login" buttons linking to respective pages.        |
| FR-04  | Responsive layout for mobile, tablet, and desktop.                         |

### 8.2 Registration and Login

| Req ID | Requirement                                                                                    |
| ------ | ---------------------------------------------------------------------------------------------- |
| FR-05  | Registration form: email, password, first name, last name, role selection, optional invite code.|
| FR-06  | Password must be at least 8 characters with uppercase, lowercase, and number.                  |
| FR-07  | If an invite code is provided, the user is automatically assigned to that family.              |
| FR-08  | Login returns a JWT stored in `localStorage`; all subsequent API calls include it.             |
| FR-09  | After login, redirect based on role: patient → dashboard, caregiver → caregiver portal, admin → admin panel. |

### 8.3 Patient Dashboard

| Req ID | Requirement                                                                                         |
| ------ | --------------------------------------------------------------------------------------------------- |
| FR-10  | Show today's medication schedule with time, medication name, dosage, and status.                     |
| FR-11  | Allow the patient to mark each schedule slot as "taken" or "skipped" with an optional note.         |
| FR-12  | Display active prescriptions with drill-down to prescription items.                                  |
| FR-13  | Show adherence percentage for the last 7 and 30 days.                                                |
| FR-14  | List and manage chronic conditions.                                                                  |
| FR-15  | List and manage allergies.                                                                           |
| FR-16  | Display notification bell with unread count; clicking opens notification list.                       |

### 8.4 Caregiver Portal

| Req ID | Requirement                                                                                         |
| ------ | --------------------------------------------------------------------------------------------------- |
| FR-17  | Show a list of all patients in the caregiver's family.                                              |
| FR-18  | Clicking a patient shows their daily schedule, adherence stats, and active prescriptions.           |
| FR-19  | Caregiver can log a dose on behalf of a patient.                                                    |
| FR-20  | Caregiver can add/edit caregiver notes for a patient.                                               |
| FR-21  | Caregiver can add a new prescription for a patient (with safety checks triggered).                  |
| FR-22  | Missed-dose notifications are sent to the caregiver.                                                 |

### 8.5 Safety Features

| Req ID | Requirement                                                                                           |
| ------ | ----------------------------------------------------------------------------------------------------- |
| FR-23  | When a prescription is created, check every medication against the patient's existing active medications for drug-drug interactions. |
| FR-24  | When a prescription is created, check every medication against the patient's allergy records.          |
| FR-25  | If an interaction or allergy conflict is found, return a warning with severity and description.        |
| FR-26  | The user interface must display the warning prominently and require explicit confirmation to proceed.  |
| FR-27  | When a dose is logged, verify no new interactions have been added since the prescription was created.  |

### 8.6 Admin Panel

| Req ID | Requirement                                                               |
| ------ | ------------------------------------------------------------------------- |
| FR-28  | Manage user accounts: view list, change role, activate/deactivate.        |
| FR-29  | Manage master medication catalog: add, edit, soft-delete.                 |
| FR-30  | Manage drug interaction pairs: add, edit, delete.                         |
| FR-31  | View audit logs with filters for user, action type, table, and date range.|

---

## 9. Non-Functional Requirements

| ID     | Category        | Requirement                                                                                       |
| ------ | --------------- | ------------------------------------------------------------------------------------------------- |
| NFR-01 | Performance     | API responses under 500 ms for 95th percentile under normal load.                                 |
| NFR-02 | Scalability     | Supabase free tier supports the thesis demo; architecture should not preclude paid tier migration. |
| NFR-03 | Availability    | Vercel serverless provides automatic scaling and high availability for the demo.                   |
| NFR-04 | Usability       | UI must work on screens 360px wide and above (mobile-first via Bootstrap 5 grid).                 |
| NFR-05 | Accessibility   | Minimum WCAG 2.1 AA compliance: sufficient contrast, form labels, keyboard navigation.            |
| NFR-06 | Maintainability | Consistent MVC folder structure; each file has a single responsibility.                           |
| NFR-07 | Data Integrity  | All foreign keys enforced at the database level; cascading deletes where appropriate.             |

---

## 10. Security and Compliance

### 10.1 Authentication

| Mechanism             | Detail                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------- |
| Password hashing      | bcrypt with cost factor 12.                                                             |
| Token format          | JWT (HS256) with `user_id`, `role`, `family_id` in payload. Expires in 24 hours.        |
| Token storage         | `localStorage` on the client. Cleared on logout.                                        |
| Token refresh         | Optional: short-lived access token (15 min) + httpOnly refresh cookie for production.   |

### 10.2 Authorization (RBAC)

```
Middleware chain: authMiddleware → roleMiddleware(allowedRoles)

Rules:
- Patient can only access their own data and family data.
- Caregiver can read/write data for patients within the same family.
- Admin can access all system-wide resources (users, medications, interactions, audit logs).
- Family boundary enforcement: every query scopes results by the user's family_id.
```

### 10.3 Data Protection

| Concern                  | Mitigation                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------- |
| SQL Injection            | Supabase JS client uses parameterized queries; no raw SQL in application code.      |
| XSS                      | Vanilla JS: use `textContent` instead of `innerHTML` when rendering user data.     |
| CSRF                     | API is token-based (not cookie-session), so CSRF is not applicable.                |
| Rate limiting            | `express-rate-limit`: 100 requests/15 min per IP on auth routes.                   |
| HTTPS                    | Enforced by Vercel and Supabase by default.                                        |
| Sensitive data in logs   | Audit logs store record IDs and JSONB diffs but never passwords or tokens.         |
| CORS                     | Restrict `Access-Control-Allow-Origin` to the Vercel deployment domain.            |
| Environment variables    | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET` stored in Vercel env vars; never committed to git. |

### 10.4 Supabase Row-Level Security (RLS)

While application-level middleware handles most authorization, RLS policies provide a defense-in-depth layer:

```sql
-- Example: patients can only read their own rows
CREATE POLICY "patients_read_own" ON patients
  FOR SELECT USING (user_id = auth.uid());

-- Example: users can only read notifications addressed to them
CREATE POLICY "notifications_own" ON notifications
  FOR SELECT USING (user_id = auth.uid());
```

---

## 11. Implementation Roadmap

This roadmap is organized into sequential phases. Each phase builds on the previous one.

### Phase 1 — Project Setup and Database

**Goal:** Working backend with database connected, no UI yet.

| Step | Task                                                                                      |
| ---- | ----------------------------------------------------------------------------------------- |
| 1.1  | Create a Supabase project. Note the project URL and anon/service keys.                    |
| 1.2  | In the Supabase SQL Editor, run the migration script to create all 15 tables in order.    |
| 1.3  | Seed the `roles` table with `patient`, `caregiver`, `admin`.                              |
| 1.4  | Seed the `medications` table with 15-20 common chronic disease drugs.                     |
| 1.5  | Seed the `drug_interactions` table with 5-10 known interaction pairs.                     |
| 1.6  | Initialize the Node.js project: `npm init -y`.                                            |
| 1.7  | Install dependencies: `express`, `@supabase/supabase-js`, `bcryptjs`, `jsonwebtoken`, `cors`, `helmet`, `express-rate-limit`, `dotenv`. |
| 1.8  | Create `.env` with `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`, `PORT`. |
| 1.9  | Create `src/config/supabase.js` — initialize and export the Supabase client.              |
| 1.10 | Create `src/server.js` — Express app with middleware stack (cors, helmet, json parser).    |
| 1.11 | Verify the server starts and can query Supabase (e.g., `GET /api/health` returns table count). |

### Phase 2 — Authentication and User Management

**Goal:** Users can register, log in, and receive role-based JWTs.

| Step | Task                                                                                      |
| ---- | ----------------------------------------------------------------------------------------- |
| 2.1  | Create `src/models/userModel.js` — functions: `findByEmail`, `create`, `findById`.        |
| 2.2  | Create `src/controllers/authController.js` — `register` and `login` handlers.             |
| 2.3  | In `register`: hash password with bcrypt, insert user row, return JWT.                    |
| 2.4  | In `login`: verify email + password, return JWT with `user_id`, `role`, `family_id`.      |
| 2.5  | Create `src/middleware/auth.js` — verify JWT, attach `req.user`.                          |
| 2.6  | Create `src/middleware/role.js` — factory function `requireRole(...roles)`.                |
| 2.7  | Create `src/routes/authRoutes.js` — wire up POST `/register`, POST `/login`, GET `/me`.   |
| 2.8  | Test with Postman/Thunder Client: register a user, log in, access `/me`.                  |

### Phase 3 — Family and Patient Management

**Goal:** Users can create/join families; patients have health profiles.

| Step | Task                                                                                      |
| ---- | ----------------------------------------------------------------------------------------- |
| 3.1  | Create `familyModel.js`, `familyController.js`, `familyRoutes.js`.                       |
| 3.2  | Implement create family (generates random invite code) and join family (by invite code).   |
| 3.3  | Update registration flow: if invite code is provided, assign `family_id` to user.         |
| 3.4  | Create `patientModel.js`, `patientController.js`, `patientRoutes.js`.                     |
| 3.5  | On patient registration, auto-create a `patients` row linked to `users.id`.               |
| 3.6  | CRUD endpoints for chronic conditions (`/api/patients/:id/conditions`).                   |
| 3.7  | Test: register two users in the same family, create patient profiles and conditions.       |

### Phase 4 — Medications, Prescriptions, and Schedules

**Goal:** Caregivers can create prescriptions; the system generates schedules.

| Step | Task                                                                                      |
| ---- | ----------------------------------------------------------------------------------------- |
| 4.1  | Create `medicationModel.js`, `medicationController.js`, `medicationRoutes.js`.            |
| 4.2  | Admin CRUD for the master medication catalog.                                              |
| 4.3  | Create `prescriptionModel.js`, `prescriptionController.js`, `prescriptionRoutes.js`.      |
| 4.4  | POST prescription: accept array of items, insert into `prescriptions` + `prescription_items`. |
| 4.5  | Create `src/services/scheduleService.js` — given a prescription item's frequency, start date, and duration, generate rows in `medication_schedules`. |
| 4.6  | After a prescription is created, call `scheduleService.generate()` for each item.         |
| 4.7  | GET `/api/patients/:pid/schedules?date=2026-04-02` — return all schedule slots for a day, joined with medication name and dosage. |
| 4.8  | Test: create a prescription with two items, verify schedule rows are generated correctly.  |

### Phase 5 — Safety Checks (Interactions and Allergies)

**Goal:** System warns on dangerous drug combinations and allergy conflicts.

| Step | Task                                                                                      |
| ---- | ----------------------------------------------------------------------------------------- |
| 5.1  | Create `allergyModel.js`, `allergyController.js`, `allergyRoutes.js` — CRUD for patient allergies. |
| 5.2  | Create `interactionModel.js`, `interactionController.js`, `interactionRoutes.js` — admin CRUD + check endpoint. |
| 5.3  | Create `src/services/safetyService.js` with two functions:                                |
|      | `checkInteractions(patient_id, medication_ids)` — query active prescription items for this patient, collect all current medication IDs, cross-reference with `drug_interactions` table. |
|      | `checkAllergies(patient_id, medication_ids)` — query `patient_allergies` where `medication_id` is in the provided list. |
| 5.4  | Integrate safety checks into `prescriptionController.create` — run checks before insert, return 409 with warnings if flagged. |
| 5.5  | Test: create an allergy for Metformin, then try to create a prescription containing Metformin — expect a 409 warning. |
| 5.6  | Test: seed an interaction between Drug A and Drug B, prescribe Drug A, then prescribe Drug B — expect a 409 warning. |

### Phase 6 — Dose Logging and Adherence

**Goal:** Patients/caregivers log doses; adherence percentages are calculated.

| Step | Task                                                                                      |
| ---- | ----------------------------------------------------------------------------------------- |
| 6.1  | Create `administrationModel.js`, `administrationController.js`, `administrationRoutes.js`.|
| 6.2  | POST `/api/administration-records` — insert record, update `medication_schedules.status`.  |
| 6.3  | Create `src/services/adherenceService.js` — calculate `(taken / total) * 100` for a date range. |
| 6.4  | GET `/api/patients/:pid/adherence?period=7d` — return adherence stats.                    |
| 6.5  | Create `src/middleware/audit.js` — on POST/PUT/DELETE responses, write to `audit_logs`.    |
| 6.6  | Test: log 5 doses, skip 2, verify adherence returns 71%.                                  |

### Phase 7 — Notifications and Caregiver Notes

**Goal:** In-app notification system and caregiver notes are functional.

| Step | Task                                                                                      |
| ---- | ----------------------------------------------------------------------------------------- |
| 7.1  | Create `notificationModel.js`, `notificationController.js`, `notificationRoutes.js`.      |
| 7.2  | Create `src/services/notificationService.js` — functions to create notifications for: upcoming dose reminders, missed doses (for caregivers), safety warnings. |
| 7.3  | Integrate: when a schedule slot passes its time without a logged dose, create a "missed" notification for the patient and their caregivers. (This can be a scheduled check or triggered on schedule query.) |
| 7.4  | Create `noteModel.js`, `noteController.js`, `noteRoutes.js` — CRUD for caregiver notes.  |
| 7.5  | Create `auditController.js`, `auditRoutes.js` — GET with query filters (admin only).      |
| 7.6  | Test: miss a dose, verify notifications are created for patient and caregiver.             |

### Phase 8 — Frontend: Landing Page, Login, Registration

**Goal:** Users can interact with the system through a browser.

| Step | Task                                                                                      |
| ---- | ----------------------------------------------------------------------------------------- |
| 8.1  | Create `public/index.html` — landing page with Bootstrap 5 navbar, hero, features, and CTA buttons. |
| 8.2  | Create `public/css/styles.css` — custom styles on top of Bootstrap.                       |
| 8.3  | Create `public/pages/register.html` and `public/js/register.js` — registration form that calls POST `/api/auth/register`. |
| 8.4  | Create `public/pages/login.html` and `public/js/login.js` — login form that stores JWT in `localStorage` and redirects by role. |
| 8.5  | Create `public/js/app.js` — shared API helper (`apiFetch` wrapper that attaches JWT), auth state check, logout function, navbar component. |
| 8.6  | Serve static files: `app.use(express.static('public'))` in `server.js`.                   |
| 8.7  | Test in browser: register, log in, verify token is stored and `/me` works.                |

### Phase 9 — Frontend: Patient Dashboard

**Goal:** Patients see their schedule, manage conditions/allergies, log doses.

| Step | Task                                                                                       |
| ---- | ------------------------------------------------------------------------------------------ |
| 9.1  | Create `public/pages/dashboard.html` — layout with schedule panel, adherence stats, sidebar links. |
| 9.2  | Create `public/js/dashboard.js` — on page load, fetch today's schedule, render as a list with "Take" / "Skip" buttons per slot. |
| 9.3  | Implement dose logging: clicking "Take" calls POST `/api/administration-records`, updates the UI. |
| 9.4  | Display adherence stats (7-day and 30-day) as progress bars or percentage badges.           |
| 9.5  | Create `public/pages/prescriptions.html` + `prescriptions.js` — list active prescriptions with item detail. |
| 9.6  | Create `public/pages/allergies.html` + `allergies.js` — list and add/remove allergies.      |
| 9.7  | Implement notification bell in navbar: fetch unread count, dropdown list, mark-as-read.     |
| 9.8  | Handle safety warning modals: when the API returns 409, show a Bootstrap modal with warning details and "Proceed Anyway" / "Cancel" buttons. |

### Phase 10 — Frontend: Caregiver Portal

**Goal:** Caregivers monitor all family patients.

| Step | Task                                                                                      |
| ---- | ----------------------------------------------------------------------------------------- |
| 10.1 | Create `public/pages/caregiver.html` + `public/js/caregiver.js`.                         |
| 10.2 | Fetch family patients list, display as cards with name, adherence summary, and "View" button. |
| 10.3 | "View" drills into the patient's schedule view (reuse schedule rendering logic).          |
| 10.4 | Add "Log Dose" action on behalf of the patient.                                           |
| 10.5 | Add caregiver notes section: list notes, add new note form.                               |
| 10.6 | Add "New Prescription" form with medication search, which triggers safety checks.         |

### Phase 11 — Frontend: Admin Panel

**Goal:** Admins manage users, medications, interactions, and audit logs.

| Step | Task                                                                                      |
| ---- | ----------------------------------------------------------------------------------------- |
| 11.1 | Create `public/pages/admin.html` + `public/js/admin.js`.                                 |
| 11.2 | Tab 1 — User management: list users with role badges, toggle active status.               |
| 11.3 | Tab 2 — Medication catalog: table with add/edit forms (Bootstrap modal).                  |
| 11.4 | Tab 3 — Drug interactions: table with pair selection dropdowns.                           |
| 11.5 | Tab 4 — Audit logs: filterable table with date range picker, user filter, action filter.  |

### Phase 12 — Deployment and Final Testing

**Goal:** Application is live on Vercel with all features working end-to-end.

| Step | Task                                                                                      |
| ---- | ----------------------------------------------------------------------------------------- |
| 12.1 | Create `vercel.json` to configure the Express server as a serverless function.            |
| 12.2 | Add environment variables in Vercel project settings.                                     |
| 12.3 | Push to GitHub, connect the repo to Vercel, trigger deployment.                           |
| 12.4 | End-to-end test: register patient + caregiver, join family, add conditions, create prescription (trigger safety check), log doses, verify caregiver view, check audit logs. |
| 12.5 | Fix any deployment-specific issues (CORS, environment variable access, static file serving).|
| 12.6 | Write thesis documentation referencing this PRD, architecture diagrams, and test results. |

---

**End of PRD.**
