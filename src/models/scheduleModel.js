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
      prescription_items!inner (
        id,
        dosage,
        instructions,
        medication_id,
        prescriptions!inner (
          status
        ),
        medications (
          id,
          generic_name,
          brand_name
        )
      )
    `)
    .eq('patient_id', patientId)
    .eq('scheduled_date', date)
    .eq('prescription_items.prescriptions.status', 'active')
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
async function getScheduleRange(patientId, startDate, endDate, limit = 100, offset = 0) {
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
    .order('scheduled_time', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
}

async function deleteByPrescriptionItemIds(itemIds) {
  if (!itemIds || itemIds.length === 0) return;
  const { error } = await supabase
    .from('medication_schedules')
    .delete()
    .in('prescription_item_id', itemIds);
  if (error) throw error;
}

module.exports = {
  createBatch,
  getDailySchedule,
  findById,
  updateStatus,
  getScheduleRange,
  deleteByPrescriptionItemIds
};
