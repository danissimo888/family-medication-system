const { supabase } = require('../config/supabase');

/**
 * Create prescription with items (transaction-like behavior)
 */
async function create(prescriptionData, items) {
  // Insert prescription
  const { data: prescription, error: prescriptionError } = await supabase
    .from('prescriptions')
    .insert([prescriptionData])
    .select()
    .single();

  if (prescriptionError) throw prescriptionError;

  // Insert prescription items
  const itemsWithPrescriptionId = items.map(item => ({
    prescription_id: prescription.id,
    medication_id: item.medication_id,
    dosage: item.dosage,
    frequency: item.frequency,
    instructions: item.instructions
  }));

  const { data: prescriptionItems, error: itemsError } = await supabase
    .from('prescription_items')
    .insert(itemsWithPrescriptionId)
    .select(`
      *,
      medications (
        id,
        generic_name,
        brand_name,
        description
      )
    `);

  if (itemsError) throw itemsError;

  // Return prescription with items
  return {
    ...prescription,
    items: prescriptionItems
  };
}

/**
 * Get all prescriptions for a patient
 */
async function findByPatient(patientId) {
  const { data, error } = await supabase
    .from('prescriptions')
    .select(`
      *,
      prescription_items (
        id,
        medication_id,
        dosage,
        frequency,
        instructions,
        medications (
          id,
          generic_name,
          brand_name
        )
      )
    `)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Get single prescription with items
 */
async function findById(id) {
  const { data, error } = await supabase
    .from('prescriptions')
    .select(`
      *,
      prescription_items (
        id,
        medication_id,
        dosage,
        frequency,
        instructions,
        medications (
          id,
          generic_name,
          description,
          side_effects
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update prescription
 */
async function update(id, updateData) {
  const { data, error } = await supabase
    .from('prescriptions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Cancel prescription (set status to cancelled)
 */
async function cancel(id) {
  const { data, error } = await supabase
    .from('prescriptions')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get active prescriptions for a patient
 */
async function findActiveByPatient(patientId) {
  const { data, error } = await supabase
    .from('prescriptions')
    .select(`
      *,
      prescription_items (
        id,
        medication_id,
        medications (
          id,
          generic_name
        )
      )
    `)
    .eq('patient_id', patientId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

module.exports = {
  create,
  findByPatient,
  findById,
  update,
  cancel,
  findActiveByPatient
};
