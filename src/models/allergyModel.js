const { supabase } = require('../config/supabase');

/**
 * Find all allergies for a patient
 */
async function findByPatient(patientId) {
  const { data, error } = await supabase
    .from('patient_allergies')
    .select(`
      id,
      patient_id,
      allergen_name,
      medication_id,
      severity,
      reaction,
      created_at,
      medication:medications (
        id,
        generic_name,
        brand_name
      )
    `)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Find allergy by ID
 */
async function findById(id) {
  const { data, error } = await supabase
    .from('patient_allergies')
    .select(`
      id,
      patient_id,
      allergen_name,
      medication_id,
      severity,
      reaction,
      created_at,
      medication:medications (
        id,
        generic_name,
        brand_name
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
}

/**
 * Create new allergy record
 */
async function create(allergyData) {
  const { data, error } = await supabase
    .from('patient_allergies')
    .insert(allergyData)
    .select(`
      id,
      patient_id,
      allergen_name,
      medication_id,
      severity,
      reaction,
      created_at,
      medication:medications (
        id,
        generic_name,
        brand_name
      )
    `)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update allergy record
 */
async function update(id, allergyData) {
  const { data, error } = await supabase
    .from('patient_allergies')
    .update(allergyData)
    .eq('id', id)
    .select(`
      id,
      patient_id,
      allergen_name,
      medication_id,
      severity,
      reaction,
      created_at,
      medication:medications (
        id,
        generic_name,
        brand_name
      )
    `)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete allergy record
 */
async function remove(id) {
  const { error } = await supabase
    .from('patient_allergies')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

/**
 * Check if patient has allergy to specific medications
 */
async function checkAllergies(patientId, medicationIds) {
  const { data, error } = await supabase
    .from('patient_allergies')
    .select(`
      id,
      medication_id,
      severity,
      reaction,
      allergen_name,
      medication:medications (
        id,
        generic_name,
        brand_name
      )
    `)
    .eq('patient_id', patientId)
    .in('medication_id', medicationIds);

  if (error) throw error;
  return data;
}

module.exports = {
  findByPatient,
  findById,
  create,
  update,
  remove,
  checkAllergies
};
