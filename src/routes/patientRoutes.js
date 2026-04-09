const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const conditionController = require('../controllers/conditionController');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/role');

// All patient routes require authentication
router.use(authMiddleware);

// Convenience endpoints (must come before /:id to avoid matching)
router.get('/me', requireRole('patient'), patientController.getMyPatientProfile);
router.get('/family', requireRole('caregiver', 'admin'), patientController.getFamilyPatients);

// Patient profile
router.get('/:id', patientController.getPatient);
router.put('/:id', patientController.updatePatient);

// Chronic conditions (nested under patient)
router.get('/:id/conditions', conditionController.getConditions);
router.post('/:id/conditions', conditionController.createCondition);
router.put('/:id/conditions/:cid', conditionController.updateCondition);
router.delete('/:id/conditions/:cid', conditionController.deleteCondition);

module.exports = router;
