const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/role');

// All routes require authentication
router.use(authMiddleware);

// Create prescription (caregiver or admin)
router.post('/', requireRole('caregiver', 'admin'), prescriptionController.create);

// Get patient prescriptions
router.get('/patient/:patientId', prescriptionController.getPatientPrescriptions);

// Get single prescription with items
router.get('/:id', prescriptionController.getById);

// Update prescription
router.put('/:id', requireRole('caregiver', 'admin'), prescriptionController.update);

// Cancel prescription
router.put('/:id/cancel', requireRole('caregiver', 'admin'), prescriptionController.cancel);

module.exports = router;
