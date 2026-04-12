const { supabase } = require('../config/supabase');

/**
 * Create a new administration record.
 */
async function create(recordData) {
  const { data, error } = await supabase
    .from('administration_records')
    .insert(recordData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Find administration record by schedule ID.
 */
async function findByScheduleId(scheduleId) {
  const { data, error } = await supabase
    .from('administration_records')
    .select('*')
    .eq('schedule_id', scheduleId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

/**
 * Get administration history for a patient.
 */
async function findByPatient(patientId) {
  const { data, error } = await supabase
    .from('administration_records')
    .select(`
      id,
      schedule_id,
      administered_by,
      status,
      administered_at,
      notes,
      created_at,
      medication_schedules!inner (
        id,
        patient_id,
        scheduled_date,
        scheduled_time,
        status,
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
      )
    `)
    .eq('medication_schedules.patient_id', patientId)
    .order('administered_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

module.exports = {
  create,
  findByScheduleId,
  findByPatient
};
