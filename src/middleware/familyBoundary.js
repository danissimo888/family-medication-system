const patientModel = require('../models/patientModel');
const { supabase } = require('../config/supabase');

async function canAccessFamily(userId, role, userFamilyId, targetFamilyId) {
  if (targetFamilyId === userFamilyId) return true;
  if (role !== 'caregiver') return false;

  const { data } = await supabase
    .from('caregiver_families')
    .select('id')
    .eq('user_id', userId)
    .eq('family_id', targetFamilyId)
    .maybeSingle();

  return !!data;
}

async function verifyPatientFamily(req, res, next) {
  const patientId = req.params.patientId || req.params.pid || req.body.patient_id;

  if (!patientId) return next();

  try {
    const patient = await patientModel.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    const hasAccess = await canAccessFamily(
      req.user.user_id, req.user.role, req.user.family_id, patient.family_id
    );

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied: patient not in your family.' });
    }

    req.patient = patient;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { verifyPatientFamily, canAccessFamily };
