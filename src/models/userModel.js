const { supabase } = require('../config/supabase');

// Look up user by email, joined with role name
async function findByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*, roles(name)')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data || null;
}

// Look up user by ID, joined with role name
async function findById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('*, roles(name)')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

// Insert a new user row
async function create(userData) {
  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select('*, roles(name)')
    .single();

  if (error) throw error;
  return data;
}

// Stamp last_login so we know when the user was last active
async function updateLastLogin(id) {
  const { error } = await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

// Get role ID by name (e.g. 'patient', 'caregiver', 'admin')
async function findRoleByName(roleName) {
  const { data, error } = await supabase
    .from('roles')
    .select('id')
    .eq('name', roleName)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

// Paginated user list for admin panel
async function findAll(limit = 50, offset = 0) {
  const { data, error, count } = await supabase
    .from('users')
    .select('*, roles(name), families!users_family_id_fkey(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { users: data || [], total: count || 0 };
}

// Enable or disable a user account
async function updateStatus(id, is_active) {
  const { data, error } = await supabase
    .from('users')
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, roles(name)')
    .single();

  if (error) throw error;
  return data;
}

// Change a user's role
async function updateRole(id, role_id) {
  const { data, error } = await supabase
    .from('users')
    .update({ role_id, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, roles(name)')
    .single();

  if (error) throw error;
  return data;
}

module.exports = {
  findByEmail,
  findById,
  create,
  updateLastLogin,
  findRoleByName,
  findAll,
  updateStatus,
  updateRole,
};
