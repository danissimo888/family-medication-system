const notificationModel = require('../models/notificationModel');

/**
 * GET /api/notifications
 * List current user's notifications
 */
async function list(req, res) {
  try {
    const userId = req.user.user_id;
    const { limit, offset, unread_only } = req.query;

    const options = {
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
      unreadOnly: unread_only === 'true'
    };

    const notifications = await notificationModel.findByUserId(userId, options);
    const unreadCount = await notificationModel.getUnreadCount(userId);

    res.json({
      notifications,
      unread_count: unreadCount,
      total: notifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const notification = await notificationModel.markAsRead(id, userId);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found or unauthorized' });
    }

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
}

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for current user
 */
async function markAllAsRead(req, res) {
  try {
    const userId = req.user.user_id;

    const count = await notificationModel.markAllAsRead(userId);

    res.json({ message: `${count} notifications marked as read`, count });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
}

module.exports = {
  list,
  markAsRead,
  markAllAsRead
};
