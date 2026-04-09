-- 012: Create drug_interactions table

CREATE TABLE IF NOT EXISTS drug_interactions (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id_1 UUID          NOT NULL REFERENCES medications(id),
    medication_id_2 UUID          NOT NULL REFERENCES medications(id),
    severity        VARCHAR(20)   NOT NULL CHECK (severity IN ('minor', 'moderate', 'major', 'contraindicated')),
    description     TEXT          NOT NULL,
    created_at      TIMESTAMPTZ   DEFAULT NOW(),

    CHECK (medication_id_1 < medication_id_2),
    UNIQUE (medication_id_1, medication_id_2)
);
