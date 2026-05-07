-- 018: Add notes column to patient_allergies table

ALTER TABLE patient_allergies
ADD COLUMN IF NOT EXISTS notes TEXT;
