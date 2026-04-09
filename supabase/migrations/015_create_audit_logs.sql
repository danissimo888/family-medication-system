-- 015: Create audit_logs table (insert-only)

CREATE TABLE IF NOT EXISTS audit_logs (
    id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID          REFERENCES users(id),
    action     VARCHAR(50)   NOT NULL,
    table_name VARCHAR(100)  NOT NULL,
    record_id  UUID          NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ   DEFAULT NOW()
);

-- Prevent UPDATE and DELETE on audit_logs (skip if rules already exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_rules WHERE rulename = 'audit_logs_no_update'
    ) THEN
        CREATE RULE audit_logs_no_update AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_rules WHERE rulename = 'audit_logs_no_delete'
    ) THEN
        CREATE RULE audit_logs_no_delete AS ON DELETE TO audit_logs DO INSTEAD NOTHING;
    END IF;
END $$;
