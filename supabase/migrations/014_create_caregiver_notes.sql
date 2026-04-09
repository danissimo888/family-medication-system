-- 014: Create caregiver_notes table

CREATE TABLE IF NOT EXISTS caregiver_notes (
    id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id        UUID          NOT NULL REFERENCES patients(id),
    caregiver_user_id UUID          NOT NULL REFERENCES users(id),
    note_date         DATE          NOT NULL DEFAULT CURRENT_DATE,
    content           TEXT          NOT NULL,
    created_at        TIMESTAMPTZ   DEFAULT NOW(),
    updated_at        TIMESTAMPTZ   DEFAULT NOW()
);
