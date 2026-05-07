-- 021: Create caregiver_families junction table for multi-family support

CREATE TABLE IF NOT EXISTS caregiver_families (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_id  UUID        NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    joined_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, family_id)
);

CREATE INDEX idx_caregiver_families_user ON caregiver_families(user_id);
CREATE INDEX idx_caregiver_families_family ON caregiver_families(family_id);

-- Migrate existing caregiver family assignments into junction table
INSERT INTO caregiver_families (user_id, family_id)
SELECT u.id, u.family_id
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE r.name = 'caregiver'
  AND u.family_id IS NOT NULL
ON CONFLICT (user_id, family_id) DO NOTHING;
