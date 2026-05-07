-- Speed up allergy safety checks during prescription creation
-- These two columns are always queried together

CREATE INDEX IF NOT EXISTS idx_patient_allergies_patient_med
  ON patient_allergies (patient_id, medication_id);
