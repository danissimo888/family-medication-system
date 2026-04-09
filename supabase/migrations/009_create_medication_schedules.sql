-- 009: Create medication_schedules table

CREATE TABLE IF NOT EXISTS medication_schedules (
    id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_item_id UUID          NOT NULL REFERENCES prescription_items(id),
    patient_id           UUID          NOT NULL REFERENCES patients(id),
    scheduled_date       DATE          NOT NULL,
    scheduled_time       TIME          NOT NULL,
    status               VARCHAR(20)   DEFAULT 'pending' CHECK (status IN ('pending', 'taken', 'skipped', 'missed')),
    created_at           TIMESTAMPTZ   DEFAULT NOW(),
    updated_at           TIMESTAMPTZ   DEFAULT NOW()
);

-- Index for fast daily-view queries
CREATE INDEX IF NOT EXISTS idx_schedules_patient_date ON medication_schedules (patient_id, scheduled_date);
