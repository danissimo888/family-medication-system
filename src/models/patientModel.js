const { supabase } = require('../config/supabase');

/**
 * Create a patient profile row linked to a user.
 */
async function create(patientData) {
  const { data, error } = await supabase
    .from('patients')
    .insert(patientData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Find a patient by their user_id.
 */
async function findByUserId(user_id) {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('user_id', user_id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

/**
 * Find a patient by patient ID.
 */
async function findById(id) {
  const { data, error } = await supabase
    .from('patients')
    .select('*, users(id, email, first_name, last_name, phone, roles(name))')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

/**
 * Update a patient's profile.
 */
async function update(id, fields) {
  const { data, error } = await supabase
    .from('patients')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get all patients in a family.
 */
async function findByFamilyId(family_id) {
  const { data, error } = await supabase
    .from('patients')
    .select('*, users(id, email, first_name, last_name, phone, roles(name))')
    .eq('family_id', family_id);

  if (error) throw error;
  return data || [];
}

module.exports = {
  create,
  findByUserId,
  findById,
  update,
  findByFamilyId,
};
