-- 005: Create chronic_conditions table

CREATE TABLE IF NOT EXISTS chronic_conditions (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id     UUID         NOT NULL REFERENCES patients(id),
    condition_name VARCHAR(150) NOT NULL,
    diagnosed_date DATE,
    severity       VARCHAR(20)  CHECK (severity IN ('mild', 'moderate', 'severe')),
    status         VARCHAR(20)  DEFAULT 'active' CHECK (status IN ('active', 'in_remission', 'resolved')),
    notes          TEXT,
    created_at     TIMESTAMPTZ  DEFAULT NOW()
);
