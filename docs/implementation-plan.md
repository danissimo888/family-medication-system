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
- [x] Test register endpoint (Postman or Thunder Client)
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
- [ ] Create `src/models/medicationModel.js`
- [ ] Create `src/controllers/medicationController.js`
- [ ] Create `src/routes/medicationRoutes.js`
- [ ] Implement admin CRUD for medications (GET list with search, GET by id, POST, PUT, DELETE soft-delete)

### 4.2 Prescriptions
- [ ] Create `src/models/prescriptionModel.js`
- [ ] Create `src/controllers/prescriptionController.js`
- [ ] Create `src/routes/prescriptionRoutes.js`
- [ ] POST prescription: accept array of items, insert into prescriptions + prescription_items
- [ ] GET patient prescriptions list
- [ ] GET single prescription with items
- [ ] PUT update and PUT cancel prescription

### 4.3 Schedule Generation
- [ ] Create `src/services/scheduleService.js` — generate medication_schedules rows from prescription item frequency, start date, and duration
- [ ] Create `src/models/scheduleModel.js`
- [ ] Create `src/controllers/scheduleController.js`
- [ ] Create `src/routes/scheduleRoutes.js`
- [ ] After prescription creation, call scheduleService.generate() for each item
- [ ] GET /api/patients/:pid/schedules?date=YYYY-MM-DD — return daily schedule joined with medication info

### 4.4 Testing
- [ ] Test: create a prescription with two items
- [ ] Test: verify schedule rows are generated correctly
- [ ] Test: query daily schedule and verify joined data

---

## Phase 5 — Safety Checks (Interactions and Allergies)

### 5.1 Patient Allergies
- [ ] Create `src/models/allergyModel.js`
- [ ] Create `src/controllers/allergyController.js`
- [ ] Create `src/routes/allergyRoutes.js`
- [ ] Implement CRUD for patient allergies

### 5.2 Drug Interactions
- [ ] Create `src/models/interactionModel.js`
- [ ] Create `src/controllers/interactionController.js`
- [ ] Create `src/routes/interactionRoutes.js`
- [ ] Admin CRUD for interaction pairs
- [ ] GET /api/interactions/check?meds=id1,id2,id3 — check interactions among a set of medications

### 5.3 Safety Service
- [ ] Create `src/services/safetyService.js`
- [ ] Implement `checkInteractions(patient_id, medication_ids)` — cross-reference new meds against patient's active prescriptions via drug_interactions table
- [ ] Implement `checkAllergies(patient_id, medication_ids)` — cross-reference new meds against patient_allergies
- [ ] Integrate safety checks into prescriptionController.create — return 409 with warnings if flagged

### 5.4 Testing
- [ ] Test: add allergy for a drug, then prescribe that drug — expect 409 warning
- [ ] Test: seed interaction between Drug A and Drug B, prescribe A then B — expect 409 warning
- [ ] Test: prescribe a safe drug — expect 201 success

---

## Phase 6 — Dose Logging and Adherence

### 6.1 Administration Records
- [ ] Create `src/models/administrationModel.js`
- [ ] Create `src/controllers/administrationController.js`
- [ ] Create `src/routes/administrationRoutes.js`
- [ ] POST /api/administration-records — insert record, update medication_schedules.status
- [ ] GET /api/patients/:pid/administration-records — dose history

### 6.2 Adherence Statistics
- [ ] Create `src/services/adherenceService.js` — calculate (taken / total) * 100 for a date range
- [ ] GET /api/patients/:pid/adherence?period=7d — return adherence percentage

### 6.3 Audit Logging
- [ ] Create `src/middleware/audit.js` — on POST/PUT/DELETE responses, write to audit_logs
- [ ] Wire audit middleware into the Express app

### 6.4 Testing
- [ ] Test: log doses (taken and skipped), verify adherence calculation is correct
- [ ] Test: verify audit_logs rows are created for mutations

---

## Phase 7 — Notifications and Caregiver Notes

### 7.1 Notifications
- [ ] Create `src/models/notificationModel.js`
- [ ] Create `src/controllers/notificationController.js`
- [ ] Create `src/routes/notificationRoutes.js`
- [ ] GET /api/notifications — list current user's notifications
- [ ] PUT /api/notifications/:id/read — mark as read
- [ ] PUT /api/notifications/read-all — mark all as read

### 7.2 Notification Service
- [ ] Create `src/services/notificationService.js`
- [ ] Implement: create notification for upcoming dose reminders
- [ ] Implement: create notification for missed doses (for patient and caregivers)
- [ ] Implement: create notification for safety warnings
- [ ] Integrate missed-dose detection: when a schedule slot passes without a logged dose, generate notifications

### 7.3 Caregiver Notes
- [ ] Create `src/models/noteModel.js`
- [ ] Create `src/controllers/noteController.js`
- [ ] Create `src/routes/noteRoutes.js`
- [ ] CRUD for caregiver notes (GET, POST, PUT, DELETE on /api/patients/:pid/notes)

### 7.4 Audit Log Viewer
- [ ] Create `src/controllers/auditController.js`
- [ ] Create `src/routes/auditRoutes.js`
- [ ] GET /api/audit-logs with query filters (user_id, action, table, date range, pagination) — admin only

### 7.5 Testing
- [ ] Test: miss a dose, verify notifications created for patient and caregiver
- [ ] Test: add/edit/delete caregiver notes
- [ ] Test: query audit logs with filters

---

## Phase 8 — Frontend: Landing Page, Login, Registration

### 8.1 Shared Assets
- [ ] Create `public/css/styles.css` — custom styles on top of Bootstrap 5
- [ ] Create `public/js/app.js` — API helper (apiFetch with JWT), auth state check, logout, navbar rendering
- [ ] Configure `express.static('public')` in server.js

### 8.2 Landing Page
- [ ] Create `public/index.html` — Bootstrap 5 navbar, hero section, feature highlights, CTA buttons (Register / Login)
- [ ] Responsive layout for mobile, tablet, desktop

### 8.3 Registration Page
- [ ] Create `public/pages/register.html` — form with email, password, name, role select, invite code
- [ ] Create `public/js/register.js` — form validation, call POST /api/auth/register, handle errors
- [ ] Password validation: min 8 chars, uppercase, lowercase, number

### 8.4 Login Page
- [ ] Create `public/pages/login.html` — email and password form
- [ ] Create `public/js/login.js` — call POST /api/auth/login, store JWT in localStorage, redirect by role

### 8.5 Testing
- [ ] Test in browser: register a new user
- [ ] Test in browser: log in, verify token stored, /me works
- [ ] Test: role-based redirect after login

---

## Phase 9 — Frontend: Patient Dashboard

### 9.1 Dashboard Layout
- [ ] Create `public/pages/dashboard.html` — schedule panel, adherence stats, sidebar navigation
- [ ] Create `public/js/dashboard.js` — fetch and render today's schedule

### 9.2 Medication Schedule View
- [ ] Render schedule as a list with time, medication name, dosage, and status per slot
- [ ] Add "Take" and "Skip" buttons per pending schedule slot
- [ ] On click: call POST /api/administration-records, update UI without reload

### 9.3 Adherence Display
- [ ] Fetch 7-day and 30-day adherence from API
- [ ] Render as progress bars or percentage badges

### 9.4 Prescriptions Page
- [ ] Create `public/pages/prescriptions.html` + `public/js/prescriptions.js`
- [ ] List active prescriptions with drill-down to prescription items

### 9.5 Allergies Page
- [ ] Create `public/pages/allergies.html` + `public/js/allergies.js`
- [ ] List allergies with add and remove functionality

### 9.6 Notifications
- [ ] Implement notification bell in navbar: fetch unread count, dropdown list, mark-as-read on click

### 9.7 Safety Warning UI
- [ ] When API returns 409, show Bootstrap modal with warning details
- [ ] Modal includes severity, description, and "Proceed Anyway" / "Cancel" buttons

### 9.8 Testing
- [ ] Test: view daily schedule, take a dose, verify UI updates
- [ ] Test: view adherence stats
- [ ] Test: add/remove allergies
- [ ] Test: trigger a safety warning and verify modal appears

---

## Phase 10 — Frontend: Caregiver Portal

### 10.1 Caregiver Layout
- [ ] Create `public/pages/caregiver.html` + `public/js/caregiver.js`
- [ ] Fetch family patients list, display as cards with name and adherence summary

### 10.2 Patient Drill-Down
- [ ] "View" button drills into patient's daily schedule (reuse schedule rendering logic)
- [ ] Show patient's active prescriptions and allergy list

### 10.3 Caregiver Actions
- [ ] "Log Dose" — caregiver can log a dose on behalf of a patient
- [ ] "New Prescription" form with medication search — triggers safety checks
- [ ] Safety warning modal for caregiver prescription creation

### 10.4 Caregiver Notes
- [ ] Notes section: list existing notes for selected patient
- [ ] Add new note form (date + content)

### 10.5 Testing
- [ ] Test: caregiver views all family patients
- [ ] Test: caregiver logs a dose for a patient
- [ ] Test: caregiver adds a prescription with safety check triggered
- [ ] Test: caregiver adds and views notes

---

## Phase 11 — Frontend: Admin Panel

### 11.1 Admin Layout
- [ ] Create `public/pages/admin.html` + `public/js/admin.js`
- [ ] Tab-based layout with four tabs

### 11.2 User Management Tab
- [ ] List users with role badges
- [ ] Toggle active/inactive status
- [ ] Change user role via dropdown

### 11.3 Medication Catalog Tab
- [ ] Table of medications with search
- [ ] Add/edit medication via Bootstrap modal form

### 11.4 Drug Interactions Tab
- [ ] Table of interaction pairs
- [ ] Add interaction with medication pair dropdowns and severity select

### 11.5 Audit Logs Tab
- [ ] Filterable table: date range picker, user filter, action filter
- [ ] Paginated results

### 11.6 Testing
- [ ] Test: admin toggles user status
- [ ] Test: admin adds a medication
- [ ] Test: admin adds a drug interaction pair
- [ ] Test: admin filters audit logs

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
