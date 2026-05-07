# Implementation Plan

## Online Family Chronic Disease Medication Management System Based On Bootstrap

**Author:** Deniz Ahmed
**Date:** 2026-04-02
**Reference:** [PRD](./prd.md)

---

## Phase 1 — Project Setup and Database

### 1.1 Supabase Setup
- [x] Create a new Supabase project
- [x] Note the project URL, anon key, and service role key

### 1.2 Database Migration (15 Tables)
- [x] Create `roles` table
- [x] Create `families` table
- [x] Create `users` table (FK → roles, families)
- [x] Create `patients` table (FK → users, families)
- [x] Create `chronic_conditions` table (FK → patients)
- [x] Create `medications` table
- [x] Create `prescriptions` table (FK → patients)
- [x] Create `prescription_items` table (FK → prescriptions, medications)
- [x] Create `medication_schedules` table (FK → prescription_items, patients)
- [x] Create `administration_records` table (FK → medication_schedules, users)
- [x] Create `patient_allergies` table (FK → patients, medications)
- [x] Create `drug_interactions` table (FK → medications)
- [x] Create `notifications` table (FK → users)
- [x] Create `caregiver_notes` table (FK → patients, users)
- [x] Create `audit_logs` table (FK → users)

### 1.3 Seed Data
- [x] Seed `roles` with: patient, caregiver, admin
- [x] Seed `medications` with 15-20 common chronic disease drugs
- [x] Seed `drug_interactions` with 5-10 known interaction pairs

### 1.4 Node.js Project Init
- [x] Run `npm init -y`
- [x] Install dependencies: express, @supabase/supabase-js, bcryptjs, jsonwebtoken, cors, helmet, express-rate-limit, dotenv
- [x] Create `.env` with SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, JWT_SECRET, PORT
- [x] Create `.gitignore` (node_modules, .env)
- [x] Create GitHub repository with README
- [x] Create `src/config/supabase.js` — initialize and export Supabase client
- [x] Create `src/server.js` — Express app with middleware stack (cors, helmet, json parser, static files)
- [x] Create `vercel.json` for deployment configuration
- [x] Verify server starts and can query Supabase (GET /api/health)

---

## Phase 2 — Authentication and User Management

### 2.1 Auth Backend
- [x] Create `src/models/userModel.js` — findByEmail, create, findById
- [x] Create `src/controllers/authController.js` — register and login handlers
- [x] Implement register: hash password with bcrypt, insert user, return JWT
- [x] Implement login: verify email + password, return JWT with user_id, role, family_id
- [x] Create `src/middleware/auth.js` — verify JWT, attach req.user
- [x] Create `src/middleware/role.js` — requireRole(...roles) factory function
- [x] Create `src/routes/authRoutes.js` — POST /register, POST /login, GET /me

### 2.2 Auth Testing
- [x] Test register endpoint (Postman)
- [x] Test login endpoint and verify JWT payload
- [x] Test GET /me with valid and invalid tokens
- [x] Test role middleware blocks unauthorized roles

---

## Phase 3 — Family and Patient Management

### 3.1 Families
- [x] Create `src/models/familyModel.js`
- [x] Create `src/controllers/familyController.js`
- [x] Create `src/routes/familyRoutes.js`
- [x] Implement create family (auto-generate invite code)
- [x] Implement join family by invite code
- [x] Update registration flow: if invite code provided, assign family_id

### 3.2 Patients
- [x] Create `src/models/patientModel.js`
- [x] Create `src/controllers/patientController.js`
- [x] Create `src/routes/patientRoutes.js`
- [x] On patient registration, auto-create a `patients` row linked to user
- [x] Implement GET/PUT patient profile

### 3.3 Chronic Conditions
- [x] Add CRUD endpoints for chronic conditions (GET, POST, PUT, DELETE on /api/patients/:id/conditions)

### 3.4 Testing
- [x] Test: register two users in the same family via invite code
- [x] Test: create patient profiles and add chronic conditions

---

## Phase 4 — Medications, Prescriptions, and Schedules

### 4.1 Medications (Master Catalog)
- [x] Create `src/models/medicationModel.js`
- [x] Create `src/controllers/medicationController.js`
- [x] Create `src/routes/medicationRoutes.js`
- [x] Implement admin CRUD for medications (GET list with search, GET by id, POST, PUT, DELETE soft-delete)

### 4.2 Prescriptions
- [x] Create `src/models/prescriptionModel.js`
- [x] Create `src/controllers/prescriptionController.js`
- [x] Create `src/routes/prescriptionRoutes.js`
- [x] POST prescription: accept array of items, insert into prescriptions + prescription_items
- [x] GET patient prescriptions list
- [x] GET single prescription with items
- [x] PUT update and PUT cancel prescription

### 4.3 Schedule Generation
- [x] Create `src/services/scheduleService.js` — generate medication_schedules rows from prescription item frequency, start date, and duration
- [x] Create `src/models/scheduleModel.js`
- [x] Create `src/controllers/scheduleController.js`
- [x] Create `src/routes/scheduleRoutes.js`
- [x] After prescription creation, call scheduleService.generate() for each item
- [x] GET /api/patients/:pid/schedules?date=YYYY-MM-DD — return daily schedule joined with medication info

### 4.4 Testing
- [x] Test: create a prescription with two items
- [x] Test: verify schedule rows are generated correctly
- [x] Test: query daily schedule and verify joined data

---

## Phase 5 — Safety Checks (Interactions and Allergies)

### 5.1 Patient Allergies
- [x] Create `src/models/allergyModel.js`
- [x] Create `src/controllers/allergyController.js`
- [x] Create `src/routes/allergyRoutes.js`
- [x] Implement CRUD for patient allergies

### 5.2 Drug Interactions
- [x] Create `src/models/interactionModel.js`
- [x] Create `src/controllers/interactionController.js`
- [x] Create `src/routes/interactionRoutes.js`
- [x] Admin CRUD for interaction pairs
- [x] GET /api/interactions/check?meds=id1,id2,id3 — check interactions among a set of medications

### 5.3 Safety Service
- [x] Create `src/services/safetyService.js`
- [x] Implement `checkInteractions(patient_id, medication_ids)` — cross-reference new meds against patient's active prescriptions via drug_interactions table
- [x] Implement `checkAllergies(patient_id, medication_ids)` — cross-reference new meds against patient_allergies
- [x] Integrate safety checks into prescriptionController.create — return 409 with warnings if flagged

### 5.4 Testing
- [x] Test: add allergy for a drug, then prescribe that drug — expect 409 warning
- [x] Test: seed interaction between Drug A and Drug B, prescribe A then B — expect 409 warning
- [x] Test: prescribe a safe drug — expect 201 success

---

## Phase 6 — Dose Logging and Adherence

### 6.1 Administration Records
- [x] Create `src/models/administrationModel.js`
- [x] Create `src/controllers/administrationController.js`
- [x] Create `src/routes/administrationRoutes.js`
- [x] POST /api/administration-records — insert record, update medication_schedules.status
- [x] GET /api/patients/:pid/administration-records — dose history

### 6.2 Adherence Statistics
- [x] Create `src/services/adherenceService.js` — calculate (taken / total) * 100 for a date range
- [x] GET /api/patients/:pid/adherence?period=7d — return adherence percentage

### 6.3 Audit Logging
- [x] Create `src/middleware/audit.js` — on POST/PUT/DELETE responses, write to audit_logs
- [x] Wire audit middleware into the Express app

### 6.4 Testing
- [x] Test: log doses (taken and skipped), verify adherence calculation is correct
- [x] Test: verify audit_logs rows are created for mutations

---

## Phase 7 — Notifications and Caregiver Notes

### 7.1 Notifications
- [x] Create `src/models/notificationModel.js`
- [x] Create `src/controllers/notificationController.js`
- [x] Create `src/routes/notificationRoutes.js`
- [x] GET /api/notifications — list current user's notifications
- [x] PUT /api/notifications/:id/read — mark as read
- [x] PUT /api/notifications/read-all — mark all as read

### 7.2 Notification Service
- [x] Create `src/services/notificationService.js`
- [x] Implement: create notification for upcoming dose reminders
- [x] Implement: create notification for missed doses (for patient and caregivers)
- [x] Implement: create notification for safety warnings
- [x] Integrate missed-dose detection: when a schedule slot passes without a logged dose, generate notifications

### 7.3 Caregiver Notes
- [x] Create `src/models/noteModel.js`
- [x] Create `src/controllers/noteController.js`
- [x] Create `src/routes/noteRoutes.js`
- [x] CRUD for caregiver notes (GET, POST, PUT, DELETE on /api/patients/:pid/notes)

### 7.4 Audit Log Viewer
- [x] Create `src/controllers/auditController.js`
- [x] Create `src/routes/auditRoutes.js`
- [x] Create `src/models/auditModel.js`
- [x] GET /api/audit-logs with query filters (user_id, action, table, date range, pagination) — admin only

### 7.5 Testing
- [x] Test: miss a dose, verify notifications created for patient and caregiver
- [x] Test: add/edit/delete caregiver notes (fully tested - create/list/update/delete all working)
- [x] Test: query audit logs with filters (tested - action, table_name, user_id, date range, pagination, admin-only access)

---

## Phase 8 — Frontend: Landing Page, Login, Registration

### 8.1 Shared Assets
- [x] Create `public/css/styles.css` — custom styles on top of Bootstrap 5
- [x] Create `public/js/app.js` — API helper (apiFetch with JWT), auth state check, logout, navbar rendering
- [x] Configure `express.static('public')` in server.js

### 8.2 Landing Page
- [x] Create `public/index.html` — Bootstrap 5 navbar, hero section, feature highlights, CTA buttons (Register / Login)
- [x] Responsive layout for mobile, tablet, desktop

### 8.3 Registration Page
- [x] Create `public/pages/register.html` — form with email, password, name, role select, invite code
- [x] Create `public/js/register.js` — form validation, call POST /api/auth/register, handle errors
- [x] Password validation: min 8 chars, uppercase, lowercase, number

### 8.4 Login Page
- [x] Create `public/pages/login.html` — email and password form
- [x] Create `public/js/login.js` — call POST /api/auth/login, store JWT in localStorage, redirect by role

### 8.5 Testing
- [x] Test in browser: register a new user
- [x] Test in browser: log in, verify token stored, /me works
- [x] Test: role-based redirect after login

---

## Phase 9 — Frontend: Patient Dashboard

### 9.1 Dashboard Layout
- [x] Create `public/pages/dashboard.html` — schedule panel, adherence stats, sidebar navigation
- [x] Create `public/js/dashboard.js` — fetch and render today's schedule

### 9.2 Medication Schedule View
- [x] Render schedule as a list with time, medication name, dosage, and status per slot
- [x] Add "Take" and "Skip" buttons per pending schedule slot
- [x] On click: call POST /api/administration-records, update UI without reload

### 9.3 Adherence Display
- [x] Fetch 7-day and 30-day adherence from API
- [x] Render as progress bars or percentage badges

### 9.4 Prescriptions Page
- [x] Create `public/pages/prescriptions.html` + `public/js/prescriptions.js`
- [x] List active prescriptions with drill-down to prescription items

### 9.5 Allergies Page
- [x] Create `public/pages/allergies.html` + `public/js/allergies.js`
- [x] List allergies with add and remove functionality

### 9.6 Notifications
- [x] Implement notification bell in navbar: fetch unread count, dropdown list, mark-as-read on click

### 9.7 Safety Warning UI
- [x] When API returns 409, show Bootstrap modal with warning details
- [x] Modal includes severity, description, and "Proceed Anyway" / "Cancel" buttons

### 9.8 Testing
- [x] Test: view daily schedule, take a dose, verify UI updates
- [x] Test: view adherence stats
- [x] Test: add/remove allergies
- [x] Test: trigger a safety warning and verify modal appears
- [x] **FIXED:** Schedule generation - wrapped response format in `{ schedules: [...] }`

---

## Phase 10 — Frontend: Caregiver Portal

### 10.1 Caregiver Layout
- [x] Create `public/pages/caregiver.html` + `public/js/caregiver.js`
- [x] Fetch family patients list, display as cards with name and adherence summary

### 10.2 Patient Drill-Down
- [x] "View" button drills into patient's daily schedule (reuse schedule rendering logic)
- [x] Show patient's active prescriptions and allergy list

### 10.3 Caregiver Actions
- [x] "Log Dose" — caregiver can log a dose on behalf of a patient
- [x] "New Prescription" form with medication search — triggers safety checks
- [x] Safety warning modal for caregiver prescription creation

### 10.4 Caregiver Notes
- [x] Notes section: list existing notes for selected patient
- [x] Add new note form (date + content)
- [x] Edit/delete notes (only author can modify)

### 10.5 Testing
- [x] Test: caregiver views all family patients
- [x] Test: caregiver logs a dose for a patient
- [x] Test: caregiver adds a prescription with safety check triggered
- [x] Test: caregiver adds and views notes

---

## Phase 11 — Frontend: Admin Panel

### 11.1 Admin Layout
- [x] Create `public/pages/admin.html` + `public/js/admin.js`
- [x] Tab-based layout with four tabs

### 11.2 User Management Tab
- [x] List users with role badges
- [x] Toggle active/inactive status
- [x] Change user role via dropdown

### 11.3 Medication Catalog Tab
- [x] Table of medications with search
- [x] Add/edit medication via Bootstrap modal form

### 11.4 Drug Interactions Tab
- [x] Table of interaction pairs
- [x] Add interaction with medication pair dropdowns and severity select

### 11.5 Audit Logs Tab
- [x] Filterable table: date range picker, user filter, action filter
- [x] Paginated results

### 11.6 Testing
- [x] Test: admin toggles user status
- [x] Test: admin adds a medication
- [x] Test: admin adds a drug interaction pair
- [x] Test: admin filters audit logs

---

## Phase 12 — Deployment and Final Testing

### 12.1 Vercel Deployment
- [ ] Verify `vercel.json` is correctly configured for Express serverless function
- [ ] Add environment variables in Vercel project settings
- [ ] Push to GitHub, connect repo to Vercel, trigger deployment
- [ ] Verify static files are served correctly on Vercel

### 12.2 End-to-End Testing
- [ ] Register a patient and a caregiver in the same family
- [ ] Patient adds chronic conditions and allergies
- [ ] Caregiver creates a prescription (verify safety checks fire)
- [ ] Patient views daily schedule and logs doses
- [ ] Caregiver views patient adherence and adds notes
- [ ] Admin views audit logs
- [ ] Verify notifications are generated for missed doses

### 12.3 Bug Fixes and Polish
- [ ] Fix any CORS or environment variable issues on Vercel
- [ ] Test on mobile viewport (360px+)
- [ ] Verify all pages have proper auth guards (redirect to login if no token)

### 12.4 Documentation
- [ ] Write thesis documentation referencing the PRD, architecture, and test results

