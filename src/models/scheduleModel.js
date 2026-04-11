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
  const startOfDay = `${date} 00:00:00`;
  const endOfDay = `${date} 23:59:59`;

  const { data, error } = await supabase
    .from('medication_schedules')
    .select(`
      id,
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
          name,
          generic_name
        )
      )
    `)
    .eq('patient_id', patientId)
    .gte('scheduled_time', startOfDay)
    .lte('scheduled_time', endOfDay)
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
          name,
          generic_name
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
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
      scheduled_time,
      status,
      prescription_items (
        dosage,
        medications (
          name
        )
      )
    `)
    .eq('patient_id', patientId)
    .gte('scheduled_time', `${startDate} 00:00:00`)
    .lte('scheduled_time', `${endDate} 23:59:59`)
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
