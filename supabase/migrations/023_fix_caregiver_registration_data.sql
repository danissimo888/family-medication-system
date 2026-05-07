-- 023: Fix existing caregivers who registered with family codes but missing junction entries
-- This handles caregivers who have family_id set but no caregiver_families row

INSERT INTO caregiver_families (user_id, family_id)
SELECT u.id, u.family_id
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE r.name = 'caregiver'
  AND u.family_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM caregiver_families cf
    WHERE cf.user_id = u.id AND cf.family_id = u.family_id
  )
ON CONFLICT (user_id, family_id) DO NOTHING;
