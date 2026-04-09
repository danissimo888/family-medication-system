-- 003: Create users table + add deferred FK on families.created_by

CREATE TABLE IF NOT EXISTS users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id       UUID         NOT NULL REFERENCES roles(id),
    family_id     UUID         REFERENCES families(id),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    phone         VARCHAR(20),
    is_active     BOOLEAN      DEFAULT TRUE,
    last_login    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- Now add the deferred FK on families.created_by (skip if already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_families_created_by'
    ) THEN
        ALTER TABLE families
            ADD CONSTRAINT fk_families_created_by
            FOREIGN KEY (created_by) REFERENCES users(id);
    END IF;
END $$;
