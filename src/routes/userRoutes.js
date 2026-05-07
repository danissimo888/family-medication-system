const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/role');

// All user management routes require authentication and admin role
router.use(authMiddleware);
router.use(requireRole('admin'));

// GET /api/users - List all users with pagination
router.get('/', userController.listUsers);

// PUT /api/users/:id/status - Toggle user active/inactive status
router.put('/:id/status', userController.toggleStatus);

// PUT /api/users/:id/role - Change user role
router.put('/:id/role', userController.changeRole);

module.exports = router;
