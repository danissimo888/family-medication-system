-- 008: Create prescription_items table

CREATE TABLE IF NOT EXISTS prescription_items (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID          NOT NULL REFERENCES prescriptions(id),
    medication_id   UUID          NOT NULL REFERENCES medications(id),
    dosage          VARCHAR(100)  NOT NULL,
    frequency       VARCHAR(100)  NOT NULL,
    duration_days   INTEGER,
    instructions    TEXT,
    created_at      TIMESTAMPTZ   DEFAULT NOW(),

    UNIQUE (prescription_id, medication_id)
);
