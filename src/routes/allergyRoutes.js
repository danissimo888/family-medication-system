const express = require('express');
const router = express.Router();
const allergyController = require('../controllers/allergyController');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/role');
const { validateAllergyInput, validateUUIDParam } = require('../middleware/validation');

router.use(authMiddleware);

router.get('/patients/:patientId/allergies', requireRole('patient', 'caregiver'), validateUUIDParam('patientId'), allergyController.getPatientAllergies);
router.post('/patients/:patientId/allergies', requireRole('patient', 'caregiver'), validateUUIDParam('patientId'), validateAllergyInput, allergyController.create);
router.get('/allergies/:id', requireRole('patient', 'caregiver'), validateUUIDParam('id'), allergyController.getById);
router.put('/allergies/:id', requireRole('patient', 'caregiver'), validateUUIDParam('id'), validateAllergyInput, allergyController.update);
router.delete('/allergies/:id', requireRole('patient', 'caregiver'), validateUUIDParam('id'), allergyController.remove);

module.exports = router;
