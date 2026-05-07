-- 026: Add brute-force protection columns to users table

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_locked_until
  ON users (locked_until)
  WHERE locked_until IS NOT NULL;

-- Atomic increment + conditional lock function
CREATE OR REPLACE FUNCTION increment_failed_login(
  p_user_id UUID,
  p_max_attempts INT,
  p_lockout_minutes INT
)
RETURNS JSON
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_new_attempts INT;
  v_locked_until TIMESTAMPTZ;
BEGIN
  UPDATE users
  SET
    failed_login_attempts = failed_login_attempts + 1,
    locked_until = CASE
      WHEN failed_login_attempts + 1 >= p_max_attempts
      THEN NOW() + (p_lockout_minutes || ' minutes')::INTERVAL
      ELSE locked_until
    END
  WHERE id = p_user_id
  RETURNING failed_login_attempts, locked_until
  INTO v_new_attempts, v_locked_until;

  RETURN json_build_object(
    'failed_login_attempts', v_new_attempts,
    'locked_until', v_locked_until
  );
END;
$$;
