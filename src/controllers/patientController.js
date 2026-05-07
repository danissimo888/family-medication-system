const patientModel = require('../models/patientModel');
const { supabase } = require('../config/supabase');

// Returns the patient if the current user is allowed to see them, null otherwise
async function authorizePatientAccess(req, patientId) {
  const patient = await patientModel.findById(patientId);
  if (!patient) return null;

  if (req.user.role === 'admin') return patient;

  if (req.user.role === 'patient' && patient.user_id === req.user.user_id) return patient;

  if (req.user.role === 'caregiver') {
    if (patient.family_id === req.user.family_id) return patient;

    const { data: membership } = await supabase
      .from('caregiver_families')
      .select('id')
      .eq('user_id', req.user.user_id)
      .eq('family_id', patient.family_id)
      .maybeSingle();
    if (membership) return patient;
  }

  return null;
}

// GET /api/patients/:id
async function getPatient(req, res) {
  try {
    const patient = await authorizePatientAccess(req, req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found or access denied.' });
    }

    res.json(patient);
  } catch (err) {
    console.error('Get patient error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

// PUT /api/patients/:id - update profile fields
async function updatePatient(req, res) {
  try {
    const patient = await authorizePatientAccess(req, req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found or access denied.' });
    }

    const allowedFields = ['date_of_birth', 'gender', 'blood_type', 'emergency_contact', 'notes'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    const updated = await patientModel.update(req.params.id, updates);
    res.json(updated);
  } catch (err) {
    console.error('Update patient error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

// GET /api/patients/me - shortcut for patients to get their own profile
async function getMyPatientProfile(req, res) {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Only patients have a patient profile.' });
    }

    let patient = await patientModel.findByUserId(req.user.user_id);

    if (!patient) {
      patient = await patientModel.create({
        user_id: req.user.user_id,
        family_id: req.user.family_id,
        date_of_birth: '2000-01-01',
        gender: null,
        blood_type: null,
      });
    }

    res.json(patient);
  } catch (err) {
    console.error('Get my patient profile error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

// GET /api/patients/family - caregivers use this to see all patients in their family
// Accepts optional ?family_id= query param for multi-family caregivers
async function getFamilyPatients(req, res) {
  try {
    const requestedFamilyId = req.query.family_id || req.user.family_id;

    if (!requestedFamilyId) {
      return res.status(400).json({ error: 'You are not a member of any family.' });
    }

    if (req.user.role === 'caregiver' && requestedFamilyId !== req.user.family_id) {
      const { data: membership } = await supabase
        .from('caregiver_families')
        .select('id')
        .eq('user_id', req.user.user_id)
        .eq('family_id', requestedFamilyId)
        .maybeSingle();

      if (!membership) {
        return res.status(403).json({ error: 'Access denied. You are not a member of this family.' });
      }
    }

    const patients = await patientModel.findByFamilyId(requestedFamilyId);
    res.json(patients);
  } catch (err) {
    console.error('Get family patients error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  getPatient,
  updatePatient,
  getMyPatientProfile,
  getFamilyPatients,
  authorizePatientAccess,
};
