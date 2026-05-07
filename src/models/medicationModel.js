const { supabase } = require('../config/supabase');

// Simple in-memory cache for the medication list - it rarely changes
const cache = { data: null, ts: 0 };
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Get all active medications, with optional name search
async function findAll(searchTerm = null) {
  // Return cached list when no search term and cache is fresh
  if (!searchTerm && cache.data && Date.now() - cache.ts < CACHE_TTL) {
    return cache.data;
  }

  let query = supabase
    .from('medications')
    .select('*')
    .eq('is_active', true)
    .order('brand_name', { ascending: true });

  if (searchTerm) {
    // Strip special chars that could mess with the query pattern
    const safe = searchTerm.replace(/[%_\\]/g, '\\$&').trim();
    query = query.or(`brand_name.ilike.%${safe}%,generic_name.ilike.%${safe}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  if (!searchTerm) {
    cache.data = data;
    cache.ts = Date.now();
  }

  return data;
}

// Get medication by ID
async function findById(id) {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// Create new medication (admin only)
async function create(medicationData) {
  const { data, error } = await supabase
    .from('medications')
    .insert([medicationData])
    .select()
    .single();

  if (error) throw error;

  // Invalidate cache
  cache.data = null;
  cache.ts = 0;

  return data;
}

// Update medication fields
async function update(id, medicationData) {
  const { data, error } = await supabase
    .from('medications')
    .update(medicationData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Invalidate cache
  cache.data = null;
  cache.ts = 0;

  return data;
}

// Deactivate instead of hard delete so prescription history stays intact
async function softDelete(id) {
  const { data, error } = await supabase
    .from('medications')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Invalidate cache
  cache.data = null;
  cache.ts = 0;

  return data;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  softDelete
};
