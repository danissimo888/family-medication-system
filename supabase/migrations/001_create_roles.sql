-- 001: Create roles table (RBAC lookup)

CREATE TABLE IF NOT EXISTS roles (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50)  UNIQUE NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Seed data
INSERT INTO roles (name, description) VALUES
    ('patient',   'An individual with chronic conditions who takes medications on a schedule'),
    ('caregiver', 'A family member who monitors and assists one or more patients'),
    ('admin',     'System administrator who manages users, medications, and reference data')
ON CONFLICT (name) DO NOTHING;
