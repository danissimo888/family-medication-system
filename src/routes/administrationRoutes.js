const express = require('express');
const router = express.Router();
const administrationController = require('../controllers/administrationController');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/role');

router.use(authMiddleware);

router.post('/administration-records', requireRole('patient', 'caregiver'), administrationController.create);
router.get('/patients/:pid/administration-records', requireRole('patient', 'caregiver'), administrationController.getPatientAdministrationRecords);
router.get('/patients/:pid/adherence', requireRole('patient', 'caregiver'), administrationController.getPatientAdherence);

module.exports = router;
