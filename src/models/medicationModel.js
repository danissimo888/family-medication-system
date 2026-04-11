const { supabase } = require('../config/supabase');

/**
 * Get all medications with optional search
 */
async function findAll(searchTerm = null) {
  let query = supabase
    .from('medications')
    .select('*')
    .eq('is_active', true)
    .order('brand_name', { ascending: true });

  if (searchTerm) {
    query = query.or(`brand_name.ilike.%${searchTerm}%,generic_name.ilike.%${searchTerm}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Get medication by ID
 */
async function findById(id) {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create new medication (admin only)
 */
async function create(medicationData) {
  const { data, error } = await supabase
    .from('medications')
    .insert([medicationData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update medication (admin only)
 */
async function update(id, medicationData) {
  const { data, error } = await supabase
    .from('medications')
    .update(medicationData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Soft delete medication (admin only)
 */
async function softDelete(id) {
  const { data, error } = await supabase
    .from('medications')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  softDelete
};
