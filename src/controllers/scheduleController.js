const scheduleModel = require('../models/scheduleModel');
const patientModel = require('../models/patientModel');
const adherenceService = require('../services/adherenceService');
const { canAccessFamily } = require('../middleware/familyBoundary');

/**
 * GET /api/patients/:pid/schedules - Get daily schedule for a patient
 */
async function getDailySchedule(req, res) {
  try {
    const { pid } = req.params;
    const { date } = req.query;

    // Default to today if no date provided
    const scheduleDate = date || new Date().toISOString().split('T')[0];

    // Verify patient exists and user has access
    const patient = await patientModel.findById(pid);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Allow access if: admin, or patient owns their own record, or same/linked family
    if (req.user.role !== 'admin' &&
        patient.user_id !== req.user.user_id &&
        patient.family_id !== req.user.family_id) {
      const hasAccess = await canAccessFamily(req.user.user_id, req.user.role, req.user.family_id, patient.family_id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const schedule = await scheduleModel.getDailySchedule(pid, scheduleDate);
    res.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
}

/**
 * GET /api/patients/:pid/schedules/range - Get schedule for a date range
 */
async function getScheduleRange(req, res) {
  try {
    const { pid } = req.params;
    const { start_date, end_date, limit, offset } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const patient = await patientModel.findById(pid);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (req.user.role !== 'admin' &&
        patient.user_id !== req.user.user_id &&
        patient.family_id !== req.user.family_id) {
      const hasAccess = await canAccessFamily(req.user.user_id, req.user.role, req.user.family_id, patient.family_id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit) || 100, 1), 500);
    const parsedOffset = Math.max(parseInt(offset) || 0, 0);

    const schedule = await scheduleModel.getScheduleRange(pid, start_date, end_date, parsedLimit, parsedOffset);
    res.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule range:', error);
    res.status(500).json({ error: 'Failed to fetch schedule range' });
  }
}

/**
 * GET /api/patients/:pid/schedules/adherence - Get adherence stats
 */
async function getAdherence(req, res) {
  try {
    const { pid } = req.params;
    const { period = '7d' } = req.query;

    const patient = await patientModel.findById(pid);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    if (req.user.role !== 'admin' &&
        patient.user_id !== req.user.user_id &&
        patient.family_id !== req.user.family_id) {
      const hasAccess = await canAccessFamily(req.user.user_id, req.user.role, req.user.family_id, patient.family_id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const data = await adherenceService.calculatePatientAdherence(pid, period);
    res.json(data);
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    res.status(500).json({ error: 'Failed to fetch adherence' });
  }
}

module.exports = {
  getDailySchedule,
  getScheduleRange,
  getAdherence
};
