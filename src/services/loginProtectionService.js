const { supabase } = require('../config/supabase');

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 5;

function getLockoutSecondsRemaining(user) {
  if (!user.locked_until) return 0;
  const remaining = Math.ceil((new Date(user.locked_until) - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

async function recordFailedAttempt(userId) {
  const { data, error } = await supabase.rpc('increment_failed_login', {
    p_user_id: userId,
    p_max_attempts: MAX_ATTEMPTS,
    p_lockout_minutes: LOCKOUT_MINUTES,
  });
  if (error) throw error;
  return data;
}

async function resetFailedAttempts(userId) {
  const { error } = await supabase
    .from('users')
    .update({ failed_login_attempts: 0, locked_until: null })
    .eq('id', userId);
  if (error) throw error;
}

module.exports = {
  MAX_ATTEMPTS,
  LOCKOUT_MINUTES,
  getLockoutSecondsRemaining,
  recordFailedAttempt,
  resetFailedAttempts,
};
