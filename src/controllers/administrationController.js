const administrationModel = require('../models/administrationModel');
const scheduleModel = require('../models/scheduleModel');
const patientModel = require('../models/patientModel');
const { authorizePatientAccess } = require('./patientController');
const adherenceService = require('../services/adherenceService');

const VALID_STATUSES = ['taken', 'skipped', 'missed'];

/**
 * POST /api/administration-records - Log a dose for a schedule slot
 */
async function create(req, res) {
  try {
    const { schedule_id, status, notes } = req.body;

    if (!schedule_id || !status) {
      return res.status(400).json({ error: 'Schedule ID and status are required' });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be taken, skipped, or missed' });
    }

    const schedule = await scheduleModel.findById(schedule_id);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const patient = await authorizePatientAccess(req, schedule.patient_id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found or access denied.' });
    }

    if (req.user.role === 'patient') {
      const ownPatient = await patientModel.findByUserId(req.user.user_id);
      if (!ownPatient || ownPatient.id !== schedule.patient_id) {
        return res.status(403).json({ error: 'Access denied: you can only log doses for your own schedule' });
      }
    }

    const existingRecord = await administrationModel.findByScheduleId(schedule_id);
    if (existingRecord) {
      return res.status(409).json({ error: 'This schedule slot has already been logged' });
    }

    const administrationRecord = await administrationModel.create({
      schedule_id,
      administered_by: req.user.user_id,
      status,
      notes: notes || null
    });

    const updatedSchedule = await scheduleModel.updateStatus(schedule_id, status);

    res.status(201).json({
      ...administrationRecord,
      updated_schedule: updatedSchedule
    });
  } catch (error) {
    console.error('Error creating administration record:', error);
    res.status(500).json({ error: 'Failed to create administration record' });
  }
}

/**
 * GET /api/patients/:pid/administration-records - Get dose history for a patient
 */
async function getPatientAdministrationRecords(req, res) {
  try {
    const { pid } = req.params;

    const patient = await authorizePatientAccess(req, pid);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found or access denied.' });
    }

    const records = await administrationModel.findByPatient(pid);
    res.json(records);
  } catch (error) {
    console.error('Error fetching administration records:', error);
    res.status(500).json({ error: 'Failed to fetch administration records' });
  }
}

/**
 * GET /api/patients/:pid/adherence?period=7d - Get adherence stats for a patient
 */
async function getPatientAdherence(req, res) {
  try {
    const { pid } = req.params;
    const { period = '7d' } = req.query;

    const patient = await authorizePatientAccess(req, pid);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found or access denied.' });
    }

    const adherence = await adherenceService.calculatePatientAdherence(pid, period);
    res.json(adherence);
  } catch (error) {
    console.error('Error fetching adherence:', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to fetch adherence' });
  }
}

module.exports = {
  create,
  getPatientAdministrationRecords,
  getPatientAdherence
};
