const scheduleModel = require('../models/scheduleModel');
const patientModel = require('../models/patientModel');

/**
 * GET /api/patients/:pid/schedules - Get daily schedule for a patient
 */
async function getDailySchedule(req, res) {
  try {
    const { pid } = req.params;
    const { date } = req.query;

    // Default to today if no date provided
    const scheduleDate = date || new Date().toISOString().split('T')[0];

    // Verify patient exists and belongs to user's family
    const patient = await patientModel.findById(pid);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (patient.family_id !== req.user.family_id) {
      return res.status(403).json({ error: 'Access denied: patient not in your family' });
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
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Verify patient exists and belongs to user's family
    const patient = await patientModel.findById(pid);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (patient.family_id !== req.user.family_id) {
      return res.status(403).json({ error: 'Access denied: patient not in your family' });
    }

    const schedule = await scheduleModel.getScheduleRange(pid, start_date, end_date);
    res.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule range:', error);
    res.status(500).json({ error: 'Failed to fetch schedule range' });
  }
}

module.exports = {
  getDailySchedule,
  getScheduleRange
};
