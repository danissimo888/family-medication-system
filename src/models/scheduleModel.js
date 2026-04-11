const { supabase } = require('../config/supabase');

/**
 * Create multiple schedule entries (batch insert)
 */
async function createBatch(schedules) {
  const { data, error } = await supabase
    .from('medication_schedules')
    .insert(schedules)
    .select();

  if (error) throw error;
  return data;
}

/**
 * Get daily schedule for a patient
 */
async function getDailySchedule(patientId, date) {
  const { data, error } = await supabase
    .from('medication_schedules')
    .select(`
      id,
      patient_id,
      scheduled_date,
      scheduled_time,
      status,
      prescription_item_id,
      prescription_items (
        id,
        dosage,
        instructions,
        medication_id,
        medications (
          id,
          generic_name,
          brand_name
        )
      )
    `)
    .eq('patient_id', patientId)
    .eq('scheduled_date', date)
    .order('scheduled_time', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get schedule by ID
 */
async function findById(id) {
  const { data, error } = await supabase
    .from('medication_schedules')
    .select(`
      *,
      prescription_items (
        id,
        dosage,
        instructions,
        medications (
          id,
          generic_name,
          brand_name
        )
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

/**
 * Update schedule status
 */
async function updateStatus(id, status) {
  const { data, error } = await supabase
    .from('medication_schedules')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get schedules for a date range
 */
async function getScheduleRange(patientId, startDate, endDate) {
  const { data, error } = await supabase
    .from('medication_schedules')
    .select(`
      id,
      patient_id,
      scheduled_date,
      scheduled_time,
      status,
      prescription_items (
        dosage,
        medications (
          generic_name,
          brand_name
        )
      )
    `)
    .eq('patient_id', patientId)
    .gte('scheduled_date', startDate)
    .lte('scheduled_date', endDate)
    .order('scheduled_date', { ascending: true })
    .order('scheduled_time', { ascending: true });

  if (error) throw error;
  return data;
}

module.exports = {
  createBatch,
  getDailySchedule,
  findById,
  updateStatus,
  getScheduleRange
};
