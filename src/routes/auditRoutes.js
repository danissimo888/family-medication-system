const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/role');

// All audit log routes require authentication and admin role
router.use(authMiddleware);
router.use(requireRole('admin'));

// GET /api/audit-logs - List audit logs with filters
router.get('/', auditController.list);

// GET /api/audit-logs/statistics - Get audit log statistics
router.get('/statistics', auditController.getStatistics);

// GET /api/audit-logs/record/:table/:id - Get audit logs for a specific record
router.get('/record/:table/:id', auditController.getByRecord);

// GET /api/audit-logs/:id - Get a single audit log by ID
router.get('/:id', auditController.getById);

module.exports = router;
