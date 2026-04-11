const prescriptionModel = require('../models/prescriptionModel');
const patientModel = require('../models/patientModel');
const scheduleService = require('../services/scheduleService');
const safetyService = require('../services/safetyService');

/**
 * POST /api/prescriptions - Create new prescription with items
 */
async function create(req, res) {
  try {
    const { patient_id, prescribed_by, start_date, end_date, notes, items, override_warnings } = req.body;

    // Validation
    if (!patient_id || !prescribed_by || !start_date || !items || items.length === 0) {
      return res.status(400).json({
        error: 'Patient ID, prescribed by, start date, and at least one item are required'
      });
    }

    // Verify patient exists and belongs to user's family
    const patient = await patientModel.findById(patient_id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (patient.family_id !== req.user.family_id) {
      return res.status(403).json({ error: 'Access denied: patient not in your family' });
    }

    // Extract medication IDs from items
    const medicationIds = items.map(item => item.medication_id);

    // Run safety checks
    const safetyCheck = await safetyService.runSafetyChecks(patient_id, medicationIds);

    // If warnings exist and user hasn't overridden, return 409 with warnings
    if (!safetyCheck.safe && !override_warnings) {
      return res.status(409).json({
        error: 'Safety warnings detected',
        warnings: safetyCheck.warnings,
        hasHighSeverity: safetyCheck.hasHighSeverity,
        hasModerateSeverity: safetyCheck.hasModerateSeverity,
        message: 'Please review the warnings and confirm to proceed'
      });
    }

    // Create prescription with items
    const prescriptionData = {
      patient_id,
      prescribed_by,
      prescribed_date: new Date().toISOString().split('T')[0], // Today's date
      start_date,
      end_date,
      notes,
      status: 'active'
    };

    const prescription = await prescriptionModel.create(prescriptionData, items);

    // Generate schedules for each prescription item
    for (const item of prescription.items) {
      await scheduleService.generate(item.id, patient_id, start_date, end_date);
    }

    // Include warnings in response if they were overridden
    const response = {
      ...prescription,
      ...(safetyCheck.warnings.length > 0 && { warnings_overridden: safetyCheck.warnings })
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
}

/**
 * GET /api/prescriptions/patient/:patientId - Get all prescriptions for a patient
 */
async function getPatientPrescriptions(req, res) {
  try {
    const { patientId } = req.params;

    // Verify patient belongs to user's family
    const patient = await patientModel.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (patient.family_id !== req.user.family_id) {
      return res.status(403).json({ error: 'Access denied: patient not in your family' });
    }

    const prescriptions = await prescriptionModel.findByPatient(patientId);
    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
}

/**
 * GET /api/prescriptions/:id - Get single prescription with items
 */
async function getById(req, res) {
  try {
    const { id } = req.params;
    const prescription = await prescriptionModel.findById(id);

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Verify prescription belongs to user's family
    const patient = await patientModel.findById(prescription.patient_id);
    if (patient.family_id !== req.user.family_id) {
      return res.status(403).json({ error: 'Access denied: prescription not in your family' });
    }

    res.json(prescription);
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({ error: 'Failed to fetch prescription' });
  }
}

/**
 * PUT /api/prescriptions/:id - Update prescription
 */
async function update(req, res) {
  try {
    const { id } = req.params;
    const { end_date, notes } = req.body;

    // Verify prescription exists and belongs to user's family
    const existing = await prescriptionModel.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const patient = await patientModel.findById(existing.patient_id);
    if (patient.family_id !== req.user.family_id) {
      return res.status(403).json({ error: 'Access denied: prescription not in your family' });
    }

    const updateData = {};
    if (end_date !== undefined) updateData.end_date = end_date;
    if (notes !== undefined) updateData.notes = notes;

    const prescription = await prescriptionModel.update(id, updateData);
    res.json(prescription);
  } catch (error) {
    console.error('Error updating prescription:', error);
    res.status(500).json({ error: 'Failed to update prescription' });
  }
}

/**
 * PUT /api/prescriptions/:id/cancel - Cancel prescription
 */
async function cancel(req, res) {
  try {
    const { id } = req.params;

    // Verify prescription exists and belongs to user's family
    const existing = await prescriptionModel.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const patient = await patientModel.findById(existing.patient_id);
    if (patient.family_id !== req.user.family_id) {
      return res.status(403).json({ error: 'Access denied: prescription not in your family' });
    }

    const prescription = await prescriptionModel.cancel(id);
    res.json({ message: 'Prescription cancelled successfully', prescription });
  } catch (error) {
    console.error('Error cancelling prescription:', error);
    res.status(500).json({ error: 'Failed to cancel prescription' });
  }
}

module.exports = {
  create,
  getPatientPrescriptions,
  getById,
  update,
  cancel
};
