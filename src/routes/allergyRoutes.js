const express = require('express');
const router = express.Router();
const allergyController = require('../controllers/allergyController');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/role');

// All routes require authentication
router.use(authMiddleware);

// Patient and caregiver can manage allergies
router.get('/patients/:patientId/allergies', requireRole('patient', 'caregiver'), allergyController.getPatientAllergies);
router.post('/patients/:patientId/allergies', requireRole('patient', 'caregiver'), allergyController.create);
router.get('/allergies/:id', requireRole('patient', 'caregiver'), allergyController.getById);
router.put('/allergies/:id', requireRole('patient', 'caregiver'), allergyController.update);
router.delete('/allergies/:id', requireRole('patient', 'caregiver'), allergyController.remove);

module.exports = router;
