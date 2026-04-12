const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access :pid from parent route
const noteController = require('../controllers/noteController');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/role');

// All note routes require authentication
router.use(authMiddleware);

// GET /api/patients/:pid/notes - List all notes for a patient
router.get('/', noteController.list);

// GET /api/patients/:pid/notes/:id - Get a single note
router.get('/:id', noteController.getById);

// POST /api/patients/:pid/notes - Create a new note (caregiver only)
router.post('/', requireRole('caregiver'), noteController.create);

// PUT /api/patients/:pid/notes/:id - Update a note (caregiver only, author only)
router.put('/:id', requireRole('caregiver'), noteController.update);

// DELETE /api/patients/:pid/notes/:id - Delete a note (caregiver only, author only)
router.delete('/:id', requireRole('caregiver'), noteController.deleteNote);

module.exports = router;
