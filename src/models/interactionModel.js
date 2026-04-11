const { supabase } = require('../config/supabase');

/**
 * Find all drug interactions
 */
async function findAll() {
  const { data, error } = await supabase
    .from('drug_interactions')
    .select(`
      id,
      medication_id_1,
      medication_id_2,
      severity,
      description,
      created_at,
      med1:medications!drug_interactions_medication_id_1_fkey (
        id,
        generic_name,
        brand_name
      ),
      med2:medications!drug_interactions_medication_id_2_fkey (
        id,
        generic_name,
        brand_name
      )
    `)
    .order('severity', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Find interaction by ID
 */
async function findById(id) {
  const { data, error } = await supabase
    .from('drug_interactions')
    .select(`
      id,
      medication_id_1,
      medication_id_2,
      severity,
      description,
      created_at,
      med1:medications!drug_interactions_medication_id_1_fkey (
        id,
        generic_name,
        brand_name
      ),
      med2:medications!drug_interactions_medication_id_2_fkey (
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
 * Create new drug interaction
 */
async function create(interactionData) {
  // Ensure medication_id_1 < medication_id_2 to satisfy CHECK constraint
  const { medication_id_1, medication_id_2, severity, description } = interactionData;

  const orderedData = {
    medication_id_1: medication_id_1 < medication_id_2 ? medication_id_1 : medication_id_2,
    medication_id_2: medication_id_1 < medication_id_2 ? medication_id_2 : medication_id_1,
    severity,
    description
  };

  const { data, error } = await supabase
    .from('drug_interactions')
    .insert(orderedData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update drug interaction
 */
async function update(id, interactionData) {
  const { data, error } = await supabase
    .from('drug_interactions')
    .update(interactionData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete drug interaction
 */
async function remove(id) {
  const { error } = await supabase
    .from('drug_interactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

/**
 * Check for interactions among a set of medications
 * Returns all interactions found between any pair in the set
 */
async function checkInteractions(medicationIds) {
  if (!medicationIds || medicationIds.length < 2) {
    return [];
  }

  // Query for interactions where both medications are in the provided set
  const { data, error } = await supabase
    .from('drug_interactions')
    .select(`
      id,
      medication_id_1,
      medication_id_2,
      severity,
      description,
      med1:medications!drug_interactions_medication_id_1_fkey (
        id,
        generic_name,
        brand_name
      ),
      med2:medications!drug_interactions_medication_id_2_fkey (
        id,
        generic_name,
        brand_name
      )
    `)
    .in('medication_id_1', medicationIds)
    .in('medication_id_2', medicationIds);

  if (error) throw error;
  return data;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
  checkInteractions
};
