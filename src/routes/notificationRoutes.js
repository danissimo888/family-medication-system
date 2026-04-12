const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/auth');

// All notification routes require authentication
router.use(authMiddleware);

// GET /api/notifications - List current user's notifications
router.get('/', notificationController.list);

// PUT /api/notifications/read-all - Mark all as read (must come before /:id route)
router.put('/read-all', notificationController.markAllAsRead);

// PUT /api/notifications/:id/read - Mark single notification as read
router.put('/:id/read', notificationController.markAsRead);

module.exports = router;
