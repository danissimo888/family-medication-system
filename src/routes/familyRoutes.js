const express = require('express');
const router = express.Router();
const familyController = require('../controllers/familyController');
const authMiddleware = require('../middleware/auth');

// All family routes require authentication
router.use(authMiddleware);

// Specific routes BEFORE parameterized routes
router.get('/my-code', familyController.getMyFamilyCode);
router.get('/my-families', familyController.getMyCaregiverFamilies);
router.post('/join', familyController.joinFamily);
router.post('/leave', familyController.leaveFamily);

// Parameterized routes AFTER specific routes
router.post('/', familyController.createFamily);
router.get('/:id', familyController.getFamily);
router.put('/:id', familyController.updateFamily);

module.exports = router;
