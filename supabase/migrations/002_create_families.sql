-- 002: Create families table

CREATE TABLE IF NOT EXISTS families (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    invite_code VARCHAR(20)  UNIQUE NOT NULL,
    created_by  UUID,        -- FK added in 003_create_users.sql
    created_at  TIMESTAMPTZ  DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  DEFAULT NOW()
);
