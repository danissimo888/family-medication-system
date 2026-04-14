const { supabase } = require('../config/supabase');

/**
 * Get audit logs with filters
 * @param {object} filters - { user_id, action, table_name, start_date, end_date, limit, offset }
 * @returns {Promise<object>} - { logs, total }
 */
async function findWithFilters(filters = {}) {
  const {
    user_id,
    action,
    table_name,
    start_date,
    end_date,
    limit = 50,
    offset = 0
  } = filters;

  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  // Apply filters
  if (user_id) {
    query = query.eq('user_id', user_id);
  }

  if (action) {
    query = query.eq('action', action);
  }

  if (table_name) {
    query = query.eq('table_name', table_name);
  }

  if (start_date) {
    query = query.gte('created_at', start_date);
  }

  if (end_date) {
    query = query.lte('created_at', end_date);
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    logs: data,
    total: count
  };
}

/**
 * Get audit log by ID
 * @param {string} logId - Audit log ID
 * @returns {Promise<object>}
 */
async function findById(logId) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      id,
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values,
      ip_address,
      created_at,
      users (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq('id', logId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get audit logs for a specific record
 * @param {string} tableName - Table name
 * @param {string} recordId - Record ID
 * @returns {Promise<Array>}
 */
async function findByRecord(tableName, recordId) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      id,
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values,
      ip_address,
      created_at,
      users (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq('table_name', tableName)
    .eq('record_id', recordId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Get audit log statistics
 * @param {object} filters - { start_date, end_date }
 * @returns {Promise<object>}
 */
async function getStatistics(filters = {}) {
  const { start_date, end_date } = filters;

  let query = supabase
    .from('audit_logs')
    .select('action, table_name');

  if (start_date) {
    query = query.gte('created_at', start_date);
  }

  if (end_date) {
    query = query.lte('created_at', end_date);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Calculate statistics
  const stats = {
    total: data.length,
    by_action: {},
    by_table: {}
  };

  data.forEach(log => {
    // Count by action
    stats.by_action[log.action] = (stats.by_action[log.action] || 0) + 1;

    // Count by table
    stats.by_table[log.table_name] = (stats.by_table[log.table_name] || 0) + 1;
  });

  return stats;
}

module.exports = {
  findWithFilters,
  findById,
  findByRecord,
  getStatistics
};
