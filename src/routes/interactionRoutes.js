const express = require('express');
const router = express.Router();
const interactionController = require('../controllers/interactionController');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/role');

// All routes require authentication
router.use(authMiddleware);

// Check interactions - available to all authenticated users
router.get('/check', interactionController.checkInteractions);

// Admin-only routes for managing interactions
router.get('/', requireRole('admin'), interactionController.getAll);
router.get('/:id', requireRole('admin'), interactionController.getById);
router.post('/', requireRole('admin'), interactionController.create);
router.put('/:id', requireRole('admin'), interactionController.update);
router.delete('/:id', requireRole('admin'), interactionController.remove);

module.exports = router;
