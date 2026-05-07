const allergyModel = require('../models/allergyModel');
const patientModel = require('../models/patientModel');
const { canAccessFamily } = require('../middleware/familyBoundary');

// GET /api/patients/:patientId/allergies
async function getPatientAllergies(req, res) {
  try {
    const { patientId } = req.params;

    // Verify patient exists and belongs to user's family
    const patient = await patientModel.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (patient.family_id !== req.user.family_id) {
      const hasAccess = await canAccessFamily(req.user.user_id, req.user.role, req.user.family_id, patient.family_id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied: patient not in your family' });
      }
    }

    const allergies = await allergyModel.findByPatient(patientId);
    res.json(allergies);
  } catch (error) {
    console.error('Error fetching allergies:', error);
    res.status(500).json({ error: 'Failed to fetch allergies' });
  }
}

// GET /api/allergies/:id
async function getById(req, res) {
  try {
    const { id } = req.params;
    const allergy = await allergyModel.findById(id);

    if (!allergy) {
      return res.status(404).json({ error: 'Allergy not found' });
    }

    // Verify allergy belongs to user's family
    const patient = await patientModel.findById(allergy.patient_id);
    if (patient.family_id !== req.user.family_id) {
      const hasAccess = await canAccessFamily(req.user.user_id, req.user.role, req.user.family_id, patient.family_id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied: allergy not in your family' });
      }
    }

    res.json(allergy);
  } catch (error) {
    console.error('Error fetching allergy:', error);
    res.status(500).json({ error: 'Failed to fetch allergy' });
  }
}

// POST /api/patients/:patientId/allergies
async function create(req, res) {
  try {
    const { patientId } = req.params;
    const { medication_id, allergen_name, severity, reaction, notes } = req.body;

    // Validation
    if (!allergen_name || !severity) {
      return res.status(400).json({
        error: 'Allergen name and severity are required'
      });
    }

    // Verify patient exists and belongs to user's family
    const patient = await patientModel.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (patient.family_id !== req.user.family_id) {
      const hasAccess = await canAccessFamily(req.user.user_id, req.user.role, req.user.family_id, patient.family_id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied: patient not in your family' });
      }
    }

    const allergyData = {
      patient_id: patientId,
      allergen_name,
      severity,
      reaction: reaction || null,
      medication_id: medication_id || null,
      notes: notes || null
    };

    const allergy = await allergyModel.create(allergyData);
    res.status(201).json(allergy);
  } catch (error) {
    console.error('Error creating allergy:', error);
    res.status(500).json({ error: 'Failed to create allergy' });
  }
}

// PUT /api/allergies/:id
async function update(req, res) {
  try {
    const { id } = req.params;
    const { severity, reaction } = req.body;

    // Verify allergy exists and belongs to user's family
    const existing = await allergyModel.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Allergy not found' });
    }

    const patient = await patientModel.findById(existing.patient_id);
    if (patient.family_id !== req.user.family_id) {
      const hasAccess = await canAccessFamily(req.user.user_id, req.user.role, req.user.family_id, patient.family_id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied: allergy not in your family' });
      }
    }

    const updateData = {};
    if (severity !== undefined) updateData.severity = severity;
    if (reaction !== undefined) updateData.reaction = reaction;

    const allergy = await allergyModel.update(id, updateData);
    res.json(allergy);
  } catch (error) {
    console.error('Error updating allergy:', error);
    res.status(500).json({ error: 'Failed to update allergy' });
  }
}

// DELETE /api/allergies/:id
async function remove(req, res) {
  try {
    const { id } = req.params;

    // Verify allergy exists and belongs to user's family
    const existing = await allergyModel.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Allergy not found' });
    }

    const patient = await patientModel.findById(existing.patient_id);
    if (patient.family_id !== req.user.family_id) {
      const hasAccess = await canAccessFamily(req.user.user_id, req.user.role, req.user.family_id, patient.family_id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied: allergy not in your family' });
      }
    }

    await allergyModel.remove(id);
    res.json({ message: 'Allergy deleted successfully' });
  } catch (error) {
    console.error('Error deleting allergy:', error);
    res.status(500).json({ error: 'Failed to delete allergy' });
  }
}

module.exports = {
  getPatientAllergies,
  getById,
  create,
  update,
  remove
};
