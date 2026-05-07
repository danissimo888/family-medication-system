-- Performance indexes for frequently queried columns missing coverage

-- Prescriptions: filtered by patient + status in findActiveByPatient, findByPatient
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_status
  ON prescriptions (patient_id, status);

-- Administration records: looked up by schedule_id during dose logging
CREATE INDEX IF NOT EXISTS idx_admin_records_schedule
  ON administration_records (schedule_id);

-- Audit logs: filtered by user, action, table, and date range in admin panel
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user
  ON audit_logs (user_id, created_at DESC);

-- Caregiver notes: queried by patient, ordered by date
CREATE INDEX IF NOT EXISTS idx_caregiver_notes_patient
  ON caregiver_notes (patient_id, created_at DESC);

-- Medication schedules: status lookup for missed-dose detection
CREATE INDEX IF NOT EXISTS idx_schedules_status_date
  ON medication_schedules (status, scheduled_date)
  WHERE status = 'pending';

-- Drug interactions: queried by medication pair during safety checks
CREATE INDEX IF NOT EXISTS idx_drug_interactions_med1
  ON drug_interactions (medication_id_1);

CREATE INDEX IF NOT EXISTS idx_drug_interactions_med2
  ON drug_interactions (medication_id_2);
