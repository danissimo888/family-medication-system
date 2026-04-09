const { supabase } = require('../config/supabase');
const crypto = require('crypto');

/**
 * Generate a random 8-character alphanumeric invite code.
 */
function generateInviteCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Create a new family with an auto-generated invite code.
 */
async function create({ name, created_by }) {
  const invite_code = generateInviteCode();

  const { data, error } = await supabase
    .from('families')
    .insert({ name, invite_code, created_by })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Find a family by ID.
 */
async function findById(id) {
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

/**
 * Find a family by invite code.
 */
async function findByInviteCode(invite_code) {
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .eq('invite_code', invite_code)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

/**
 * Update family name.
 */
async function update(id, fields) {
  const { data, error } = await supabase
    .from('families')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get all members (users) belonging to a family.
 */
async function getMembers(family_id) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, phone, is_active, roles(name)')
    .eq('family_id', family_id)
    .eq('is_active', true);

  if (error) throw error;
  return data || [];
}

module.exports = {
  generateInviteCode,
  create,
  findById,
  findByInviteCode,
  update,
  getMembers,
};
