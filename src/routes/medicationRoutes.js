const express = require('express');
const router = express.Router();
const medicationController = require('../controllers/medicationController');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/role');

// Public routes (authenticated users can view medications)
router.get('/', authMiddleware, medicationController.list);
router.get('/:id', authMiddleware, medicationController.getById);

// Admin-only routes
router.post('/', authMiddleware, requireRole('admin'), medicationController.create);
router.put('/:id', authMiddleware, requireRole('admin'), medicationController.update);
router.delete('/:id', authMiddleware, requireRole('admin'), medicationController.remove);

module.exports = router;
