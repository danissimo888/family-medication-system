-- 004: Create patients table

CREATE TABLE IF NOT EXISTS patients (
    id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID          UNIQUE NOT NULL REFERENCES users(id),
    family_id         UUID          NOT NULL REFERENCES families(id),
    date_of_birth     DATE          NOT NULL,
    gender            VARCHAR(20),
    blood_type        VARCHAR(5),
    emergency_contact VARCHAR(255),
    notes             TEXT,
    created_at        TIMESTAMPTZ   DEFAULT NOW(),
    updated_at        TIMESTAMPTZ   DEFAULT NOW()
);
