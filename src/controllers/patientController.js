const patientModel = require('../models/patientModel');

/**
 * Helper: check if the requesting user can access this patient.
 * Returns the patient record or null.
 */
async function authorizePatientAccess(req, patientId) {
  const patient = await patientModel.findById(patientId);
  if (!patient) return null;

  // Admin can access any patient
  if (req.user.role === 'admin') return patient;

  // Patient can access only their own profile
  if (req.user.role === 'patient' && patient.user_id === req.user.user_id) return patient;

  // Caregiver can access patients in their family
  if (req.user.role === 'caregiver' && patient.family_id === req.user.family_id) return patient;

  return null;
}

/**
 * GET /api/patients/:id
 * Get patient profile.
 */
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

/**
 * PUT /api/patients/:id
 * Update patient profile.
 * Body: { date_of_birth?, gender?, blood_type?, emergency_contact?, notes? }
 */
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

/**
 * GET /api/patients/me
 * Get the current user's patient profile (convenience endpoint).
 */
async function getMyPatientProfile(req, res) {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Only patients have a patient profile.' });
    }

    const patient = await patientModel.findByUserId(req.user.user_id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found. Please complete your profile.' });
    }

    res.json(patient);
  } catch (err) {
    console.error('Get my patient profile error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * GET /api/patients/family
 * Get all patients in the current user's family (for caregivers).
 */
async function getFamilyPatients(req, res) {
  try {
    if (!req.user.family_id) {
      return res.status(400).json({ error: 'You are not a member of any family.' });
    }

    const patients = await patientModel.findByFamilyId(req.user.family_id);
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
