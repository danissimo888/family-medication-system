-- 024: Clean up duplicate families created by the bug
-- Keep only the family referenced in users.family_id, delete orphaned families

-- Delete families that are NOT referenced by any user's family_id
-- AND are NOT referenced in caregiver_families junction table
DELETE FROM families f
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.family_id = f.id
)
AND NOT EXISTS (
  SELECT 1 FROM caregiver_families cf WHERE cf.family_id = f.id
);
