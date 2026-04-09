-- 007: Create prescriptions table

CREATE TABLE IF NOT EXISTS prescriptions (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID          NOT NULL REFERENCES patients(id),
    prescribed_by   VARCHAR(200)  NOT NULL,
    prescribed_date DATE          NOT NULL,
    start_date      DATE          NOT NULL,
    end_date        DATE,
    status          VARCHAR(20)   DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    notes           TEXT,
    created_at      TIMESTAMPTZ   DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   DEFAULT NOW()
);
