const { supabase } = require('../config/supabase');

/**
 * Get all notes for a patient
 * @param {string} patientId - Patient ID
 * @param {string} familyId - Family ID for authorization
 * @returns {Promise<Array>}
 */
async function findByPatientId(patientId, familyId) {
  const { data, error } = await supabase
    .from('caregiver_notes')
    .select(`
      id,
      patient_id,
      caregiver_user_id,
      note_date,
      content,
      created_at,
      updated_at,
      users!caregiver_notes_caregiver_user_id_fkey (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq('patient_id', patientId)
    .order('note_date', { ascending: false });

  if (error) throw error;

  // Verify patient belongs to the family
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('family_id')
    .eq('id', patientId)
    .single();

  if (patientError || !patient || patient.family_id !== familyId) {
    throw new Error('Unauthorized access to patient notes');
  }

  return data;
}

/**
 * Get a single note by ID
 * @param {string} noteId - Note ID
 * @param {string} familyId - Family ID for authorization
 * @returns {Promise<object>}
 */
async function findById(noteId, familyId) {
  const { data, error } = await supabase
    .from('caregiver_notes')
    .select(`
      id,
      patient_id,
      caregiver_user_id,
      note_date,
      content,
      created_at,
      updated_at,
      users!caregiver_notes_caregiver_user_id_fkey (
        id,
        first_name,
        last_name,
        email
      ),
      patients!caregiver_notes_patient_id_fkey (
        family_id
      )
    `)
    .eq('id', noteId)
    .single();

  if (error) throw error;

  // Verify patient belongs to the family
  if (data.patients.family_id !== familyId) {
    throw new Error('Unauthorized access to note');
  }

  return data;
}

/**
 * Create a new caregiver note
 * @param {object} noteData - { patient_id, caregiver_id, note_date, content }
 * @param {string} familyId - Family ID for authorization
 * @returns {Promise<object>}
 */
async function create(noteData, familyId) {
  // Verify patient belongs to the family
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('family_id')
    .eq('id', noteData.patient_id)
    .single();

  if (patientError || !patient || patient.family_id !== familyId) {
    throw new Error('Unauthorized: Patient not in your family');
  }

  const { data, error } = await supabase
    .from('caregiver_notes')
    .insert({
      patient_id: noteData.patient_id,
      caregiver_user_id: noteData.caregiver_id,
      note_date: noteData.note_date,
      content: noteData.content
    })
    .select(`
      id,
      patient_id,
      caregiver_user_id,
      note_date,
      content,
      created_at,
      updated_at,
      users!caregiver_notes_caregiver_user_id_fkey (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a caregiver note
 * @param {string} noteId - Note ID
 * @param {object} updates - { note_date, content }
 * @param {string} caregiverId - Caregiver ID (only author can update)
 * @param {string} familyId - Family ID for authorization
 * @returns {Promise<object>}
 */
async function update(noteId, updates, caregiverId, familyId) {
  // Verify note exists and belongs to the caregiver and family
  const { data: existingNote, error: fetchError } = await supabase
    .from('caregiver_notes')
    .select(`
      id,
      caregiver_user_id,
      patients!caregiver_notes_patient_id_fkey (
        family_id
      )
    `)
    .eq('id', noteId)
    .single();

  if (fetchError || !existingNote) {
    throw new Error('Note not found');
  }

  if (existingNote.patients.family_id !== familyId) {
    throw new Error('Unauthorized: Note not in your family');
  }

  if (existingNote.caregiver_user_id !== caregiverId) {
    throw new Error('Unauthorized: Only the note author can update it');
  }

  const { data, error } = await supabase
    .from('caregiver_notes')
    .update({
      note_date: updates.note_date,
      content: updates.content,
      updated_at: new Date().toISOString()
    })
    .eq('id', noteId)
    .select(`
      id,
      patient_id,
      caregiver_user_id,
      note_date,
      content,
      created_at,
      updated_at,
      users!caregiver_notes_caregiver_user_id_fkey (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a caregiver note
 * @param {string} noteId - Note ID
 * @param {string} caregiverId - Caregiver ID (only author can delete)
 * @param {string} familyId - Family ID for authorization
 * @returns {Promise<void>}
 */
async function deleteNote(noteId, caregiverId, familyId) {
  // Verify note exists and belongs to the caregiver and family
  const { data: existingNote, error: fetchError } = await supabase
    .from('caregiver_notes')
    .select(`
      id,
      caregiver_user_id,
      patients!caregiver_notes_patient_id_fkey (
        family_id
      )
    `)
    .eq('id', noteId)
    .single();

  if (fetchError || !existingNote) {
    throw new Error('Note not found');
  }

  if (existingNote.patients.family_id !== familyId) {
    throw new Error('Unauthorized: Note not in your family');
  }

  if (existingNote.caregiver_user_id !== caregiverId) {
    throw new Error('Unauthorized: Only the note author can delete it');
  }

  const { error } = await supabase
    .from('caregiver_notes')
    .delete()
    .eq('id', noteId);

  if (error) throw error;
}

module.exports = {
  findByPatientId,
  findById,
  create,
  update,
  deleteNote
};
