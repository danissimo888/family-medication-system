const conditionModel = require('../models/conditionModel');
const { authorizePatientAccess } = require('./patientController');

/**
 * GET /api/patients/:id/conditions
 * List chronic conditions for a patient.
 */
async function getConditions(req, res) {
  try {
    const patient = await authorizePatientAccess(req, req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found or access denied.' });
    }

    const conditions = await conditionModel.findByPatientId(patient.id);
    res.json(conditions);
  } catch (err) {
    console.error('Get conditions error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * POST /api/patients/:id/conditions
 * Add a chronic condition.
 * Body: { condition_name, diagnosed_date?, severity?, status?, notes? }
 */
async function createCondition(req, res) {
  try {
    const patient = await authorizePatientAccess(req, req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found or access denied.' });
    }

    const { condition_name, diagnosed_date, severity, status, notes } = req.body;

    if (!condition_name) {
      return res.status(400).json({ error: 'condition_name is required.' });
    }

    // Validate severity if provided
    if (severity && !['mild', 'moderate', 'severe'].includes(severity)) {
      return res.status(400).json({ error: 'severity must be one of: mild, moderate, severe.' });
    }

    // Validate status if provided
    if (status && !['active', 'in_remission', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'status must be one of: active, in_remission, resolved.' });
    }

    const condition = await conditionModel.create({
      patient_id: patient.id,
      condition_name,
      diagnosed_date: diagnosed_date || null,
      severity: severity || null,
      status: status || 'active',
      notes: notes || null,
    });

    res.status(201).json(condition);
  } catch (err) {
    console.error('Create condition error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * PUT /api/patients/:id/conditions/:cid
 * Update a chronic condition.
 */
async function updateCondition(req, res) {
  try {
    const patient = await authorizePatientAccess(req, req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found or access denied.' });
    }

    const condition = await conditionModel.findById(req.params.cid);
    if (!condition || condition.patient_id !== patient.id) {
      return res.status(404).json({ error: 'Condition not found.' });
    }

    const allowedFields = ['condition_name', 'diagnosed_date', 'severity', 'status', 'notes'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    // Validate severity if provided
    if (updates.severity && !['mild', 'moderate', 'severe'].includes(updates.severity)) {
      return res.status(400).json({ error: 'severity must be one of: mild, moderate, severe.' });
    }

    // Validate status if provided
    if (updates.status && !['active', 'in_remission', 'resolved'].includes(updates.status)) {
      return res.status(400).json({ error: 'status must be one of: active, in_remission, resolved.' });
    }

    const updated = await conditionModel.update(req.params.cid, updates);
    res.json(updated);
  } catch (err) {
    console.error('Update condition error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * DELETE /api/patients/:id/conditions/:cid
 * Remove a chronic condition.
 */
async function deleteCondition(req, res) {
  try {
    const patient = await authorizePatientAccess(req, req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found or access denied.' });
    }

    const condition = await conditionModel.findById(req.params.cid);
    if (!condition || condition.patient_id !== patient.id) {
      return res.status(404).json({ error: 'Condition not found.' });
    }

    await conditionModel.remove(req.params.cid);
    res.json({ message: 'Condition deleted successfully.' });
  } catch (err) {
    console.error('Delete condition error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  getConditions,
  createCondition,
  updateCondition,
  deleteCondition,
};
