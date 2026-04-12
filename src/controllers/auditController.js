const auditModel = require('../models/auditModel');

/**
 * GET /api/audit-logs
 * List audit logs with filters (admin only)
 */
async function list(req, res) {
  try {
    const {
      user_id,
      action,
      table_name,
      start_date,
      end_date,
      limit,
      offset
    } = req.query;

    const filters = {
      user_id,
      action,
      table_name,
      start_date,
      end_date,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0
    };

    const result = await auditModel.findWithFilters(filters);

    res.json({
      logs: result.logs,
      total: result.total,
      limit: filters.limit,
      offset: filters.offset
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
}

/**
 * GET /api/audit-logs/:id
 * Get a single audit log by ID (admin only)
 */
async function getById(req, res) {
  try {
    const { id } = req.params;

    const log = await auditModel.findById(id);

    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    res.json({ log });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
}

/**
 * GET /api/audit-logs/record/:table/:id
 * Get audit logs for a specific record (admin only)
 */
async function getByRecord(req, res) {
  try {
    const { table, id } = req.params;

    const logs = await auditModel.findByRecord(table, id);

    res.json({ logs, total: logs.length });
  } catch (error) {
    console.error('Error fetching audit logs for record:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs for record' });
  }
}

/**
 * GET /api/audit-logs/statistics
 * Get audit log statistics (admin only)
 */
async function getStatistics(req, res) {
  try {
    const { start_date, end_date } = req.query;

    const stats = await auditModel.getStatistics({ start_date, end_date });

    res.json({ statistics: stats });
  } catch (error) {
    console.error('Error fetching audit log statistics:', error);
    res.status(500).json({ error: 'Failed to fetch audit log statistics' });
  }
}

module.exports = {
  list,
  getById,
  getByRecord,
  getStatistics
};
