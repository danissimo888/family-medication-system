-- 010: Create administration_records table

CREATE TABLE IF NOT EXISTS administration_records (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id     UUID          NOT NULL REFERENCES medication_schedules(id),
    administered_by UUID          NOT NULL REFERENCES users(id),
    status          VARCHAR(20)   NOT NULL CHECK (status IN ('taken', 'skipped', 'missed')),
    administered_at TIMESTAMPTZ   DEFAULT NOW(),
    notes           TEXT,
    created_at      TIMESTAMPTZ   DEFAULT NOW()
);
