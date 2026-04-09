-- 006: Create medications table (master catalog)

CREATE TABLE IF NOT EXISTS medications (
    id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    generic_name VARCHAR(200)  NOT NULL,
    brand_name   VARCHAR(200),
    dosage_form  VARCHAR(50)   NOT NULL,
    strength     VARCHAR(50)   NOT NULL,
    manufacturer VARCHAR(200),
    description  TEXT,
    side_effects TEXT,
    is_active    BOOLEAN       DEFAULT TRUE,
    created_at   TIMESTAMPTZ   DEFAULT NOW()
);
