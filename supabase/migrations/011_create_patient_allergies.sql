-- 011: Create patient_allergies table

CREATE TABLE IF NOT EXISTS patient_allergies (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id    UUID          NOT NULL REFERENCES patients(id),
    allergen_name VARCHAR(200)  NOT NULL,
    medication_id UUID          REFERENCES medications(id),
    severity      VARCHAR(20)   CHECK (severity IN ('mild', 'moderate', 'severe', 'life_threatening')),
    reaction      TEXT,
    created_at    TIMESTAMPTZ   DEFAULT NOW()
);
