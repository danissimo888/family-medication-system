const express = require('express');
const router = express.Router();
const familyController = require('../controllers/familyController');
const authMiddleware = require('../middleware/auth');

// All family routes require authentication
router.use(authMiddleware);

router.post('/', familyController.createFamily);
router.post('/join', familyController.joinFamily);
router.get('/:id', familyController.getFamily);
router.put('/:id', familyController.updateFamily);

module.exports = router;
