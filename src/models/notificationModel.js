const { supabase } = require('../config/supabase');

/**
 * Get notifications for a user
 * @param {string} userId - User ID
 * @param {object} options - Query options (limit, offset, unreadOnly)
 * @returns {Promise<Array>}
 */
async function findByUserId(userId, options = {}) {
  const { limit = 50, offset = 0, unreadOnly = false } = options;

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Get unread notification count for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>}
 */
async function getUnreadCount(userId) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
}

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<object>}
 */
async function markAsRead(notificationId, userId) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Number of notifications updated
 */
async function markAllAsRead(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false)
    .select();

  if (error) throw error;
  return data.length;
}

/**
 * Create a notification
 * @param {object} notificationData - { user_id, type, title, message, related_entity_type, related_entity_id }
 * @returns {Promise<object>}
 */
async function create(notificationData) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: notificationData.user_id,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      related_entity_type: notificationData.related_entity_type || null,
      related_entity_id: notificationData.related_entity_id || null,
      is_read: false
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete old read notifications (cleanup utility)
 * @param {number} daysOld - Delete notifications older than this many days
 * @returns {Promise<number>}
 */
async function deleteOldRead(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const { data, error } = await supabase
    .from('notifications')
    .delete()
    .eq('is_read', true)
    .lt('read_at', cutoffDate.toISOString())
    .select();

  if (error) throw error;
  return data.length;
}

module.exports = {
  findByUserId,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  create,
  deleteOldRead
};
