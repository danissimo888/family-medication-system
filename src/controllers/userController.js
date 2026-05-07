const userModel = require('../models/userModel');

/**
 * GET /api/users
 * List all users with pagination.
 */
async function listUsers(req, res) {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;

    const { users, total } = await userModel.findAll(limit, offset);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * PUT /api/users/:id/status
 * Toggle user active/inactive status.
 */
async function toggleStatus(req, res) {
  try {
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active must be a boolean.' });
    }

    // Prevent admin from deactivating themselves
    if (req.params.id === req.user.user_id && !is_active) {
      return res.status(400).json({ error: 'You cannot deactivate your own account.' });
    }

    const user = await userModel.updateStatus(req.params.id, is_active);
    res.json(user);
  } catch (err) {
    console.error('Toggle user status error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * PUT /api/users/:id/role
 * Change user role.
 */
async function changeRole(req, res) {
  try {
    const { role_id } = req.body;

    if (!role_id) {
      return res.status(400).json({ error: 'role_id is required.' });
    }

    // Prevent admin from changing their own role
    if (req.params.id === req.user.user_id) {
      return res.status(400).json({ error: 'You cannot change your own role.' });
    }

    const user = await userModel.updateRole(req.params.id, role_id);
    res.json(user);
  } catch (err) {
    console.error('Change user role error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  listUsers,
  toggleStatus,
  changeRole,
};
