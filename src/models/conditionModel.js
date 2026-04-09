const { supabase } = require('../config/supabase');

/**
 * Get all conditions for a patient.
 */
async function findByPatientId(patient_id) {
  const { data, error } = await supabase
    .from('chronic_conditions')
    .select('*')
    .eq('patient_id', patient_id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Find a condition by ID.
 */
async function findById(id) {
  const { data, error } = await supabase
    .from('chronic_conditions')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

/**
 * Create a new chronic condition.
 */
async function create(conditionData) {
  const { data, error } = await supabase
    .from('chronic_conditions')
    .insert(conditionData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a chronic condition.
 */
async function update(id, fields) {
  const { data, error } = await supabase
    .from('chronic_conditions')
    .update(fields)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a chronic condition.
 */
async function remove(id) {
  const { error } = await supabase
    .from('chronic_conditions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

module.exports = {
  findByPatientId,
  findById,
  create,
  update,
  remove,
};
