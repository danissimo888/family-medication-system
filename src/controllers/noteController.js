const noteModel = require('../models/noteModel');
const patientModel = require('../models/patientModel');
const { canAccessFamily } = require('../middleware/familyBoundary');

async function resolvePatientFamilyId(req, patientId) {
  const patient = await patientModel.findById(patientId);
  if (!patient) return null;
  if (patient.family_id === req.user.family_id) return patient.family_id;
  const hasAccess = await canAccessFamily(req.user.user_id, req.user.role, req.user.family_id, patient.family_id);
  return hasAccess ? patient.family_id : null;
}

/**
 * GET /api/patients/:pid/notes
 * List all notes for a patient
 */
async function list(req, res) {
  try {
    const { pid } = req.params;
    const familyId = await resolvePatientFamilyId(req, pid);
    if (!familyId) {
      return res.status(403).json({ error: 'Access denied: patient not in your family' });
    }

    const notes = await noteModel.findByPatientId(pid, familyId);

    res.json({ notes });
  } catch (error) {
    console.error('Error fetching caregiver notes:', error);
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to fetch caregiver notes' });
  }
}

/**
 * GET /api/patients/:pid/notes/:id
 * Get a single note by ID
 */
async function getById(req, res) {
  try {
    const { id } = req.params;
    const { pid } = req.params;
    const familyId = await resolvePatientFamilyId(req, pid);
    if (!familyId) {
      return res.status(403).json({ error: 'Access denied: patient not in your family' });
    }

    const note = await noteModel.findById(id, familyId);

    res.json({ note });
  } catch (error) {
    console.error('Error fetching note:', error);
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ error: error.message });
    }
    res.status(404).json({ error: 'Note not found' });
  }
}

/**
 * POST /api/patients/:pid/notes
 * Create a new caregiver note
 */
async function create(req, res) {
  try {
    const { pid } = req.params;
    const { note_date, content } = req.body;
    const caregiverId = req.user.user_id;
    const familyId = await resolvePatientFamilyId(req, pid);
    if (!familyId) {
      return res.status(403).json({ error: 'Access denied: patient not in your family' });
    }

    // Validate required fields
    if (!note_date || !content) {
      return res.status(400).json({ error: 'note_date and content are required' });
    }

    // Only caregivers can create notes
    if (req.user.role !== 'caregiver') {
      return res.status(403).json({ error: 'Only caregivers can create notes' });
    }

    const noteData = {
      patient_id: pid,
      caregiver_id: caregiverId,
      note_date,
      content
    };

    const note = await noteModel.create(noteData, familyId);

    res.status(201).json({ message: 'Note created successfully', note });
  } catch (error) {
    console.error('Error creating note:', error);
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create note' });
  }
}

/**
 * PUT /api/patients/:pid/notes/:id
 * Update a caregiver note
 */
async function update(req, res) {
  try {
    const { id } = req.params;
    const { note_date, content } = req.body;
    const caregiverId = req.user.user_id;
    const { pid } = req.params;
    const familyId = await resolvePatientFamilyId(req, pid);
    if (!familyId) {
      return res.status(403).json({ error: 'Access denied: patient not in your family' });
    }

    // Validate required fields
    if (!note_date || !content) {
      return res.status(400).json({ error: 'note_date and content are required' });
    }

    const updates = { note_date, content };

    const note = await noteModel.update(id, updates, caregiverId, familyId);

    res.json({ message: 'Note updated successfully', note });
  } catch (error) {
    console.error('Error updating note:', error);
    if (error.message.includes('Unauthorized') || error.message.includes('Only the note author')) {
      return res.status(403).json({ error: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update note' });
  }
}

/**
 * DELETE /api/patients/:pid/notes/:id
 * Delete a caregiver note
 */
async function deleteNote(req, res) {
  try {
    const { id } = req.params;
    const caregiverId = req.user.user_id;
    const { pid } = req.params;
    const familyId = await resolvePatientFamilyId(req, pid);
    if (!familyId) {
      return res.status(403).json({ error: 'Access denied: patient not in your family' });
    }

    await noteModel.deleteNote(id, caregiverId, familyId);

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    if (error.message.includes('Unauthorized') || error.message.includes('Only the note author')) {
      return res.status(403).json({ error: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete note' });
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  deleteNote
};
