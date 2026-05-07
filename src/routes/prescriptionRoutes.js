const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/role');
const { validatePrescriptionInput, validateUUIDParam } = require('../middleware/validation');

router.use(authMiddleware);

router.post('/', requireRole('patient', 'caregiver', 'admin'), validatePrescriptionInput, prescriptionController.create);

router.get('/patient/:patientId', validateUUIDParam('patientId'), prescriptionController.getPatientPrescriptions);

router.get('/:id', validateUUIDParam('id'), prescriptionController.getById);

router.put('/:id', requireRole('caregiver', 'admin'), validateUUIDParam('id'), prescriptionController.update);

router.put('/:id/cancel', requireRole('patient', 'caregiver', 'admin'), validateUUIDParam('id'), prescriptionController.cancel);

module.exports = router;
