const express = require('express');
const router = express.Router({ mergeParams: true });
const scheduleController = require('../controllers/scheduleController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get adherence stats (must be before '/' to avoid conflict)
router.get('/adherence', scheduleController.getAdherence);

// Get daily schedule for a patient
router.get('/', scheduleController.getDailySchedule);

// Get schedule for a date range
router.get('/range', scheduleController.getScheduleRange);

module.exports = router;
