const { supabase } = require('../config/supabase');

/**
 * Find a user by email address, joined with their role name.
 */
async function findByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*, roles(name)')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data || null;
}

/**
 * Find a user by ID, joined with their role name.
 */
async function findById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('*, roles(name)')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

/**
 * Create a new user row.
 * @param {Object} userData - { role_id, family_id, email, password_hash, first_name, last_name, phone }
 */
async function create(userData) {
  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select('*, roles(name)')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update last_login timestamp for a user.
 */
async function updateLastLogin(id) {
  const { error } = await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Look up a role by name and return its id.
 */
async function findRoleByName(roleName) {
  const { data, error } = await supabase
    .from('roles')
    .select('id')
    .eq('name', roleName)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

module.exports = {
  findByEmail,
  findById,
  create,
  updateLastLogin,
  findRoleByName,
};
