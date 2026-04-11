const { supabase } = require('../config/supabase');

function inferAuditTableName(req) {
  if (req.path.includes('/administration-records')) return 'administration_records';
  if (req.path.includes('/prescriptions')) return 'prescriptions';
  if (req.path.includes('/allergies')) return 'patient_allergies';
  if (req.path.includes('/interactions')) return 'drug_interactions';
  if (req.path.includes('/families')) return 'families';
  if (req.path.includes('/patients')) return 'patients';
  if (req.path.includes('/medications')) return 'medications';
  return 'unknown';
}

function extractRecordId(body) {
  if (!body || typeof body !== 'object') return null;
  if (body.id) return body.id;
  if (body.record_id) return body.record_id;
  if (body.prescription && body.prescription.id) return body.prescription.id;
  return null;
}

function auditMiddleware(req, res, next) {
  if (!['POST', 'PUT', 'DELETE'].includes(req.method) || !req.path.startsWith('/api/')) {
    return next();
  }

  const originalJson = res.json.bind(res);

  res.json = function patchedJson(body) {
    const shouldAudit = res.statusCode >= 200 && res.statusCode < 300 && req.user;

    if (shouldAudit) {
      const payload = {
        user_id: req.user.user_id,
        action: req.method,
        table_name: inferAuditTableName(req),
        record_id: extractRecordId(body) || req.params.id || req.body.schedule_id || req.body.patient_id || req.user.user_id,
        new_values: body,
        ip_address: req.ip || null
      };

      supabase
        .from('audit_logs')
        .insert(payload)
        .then(({ error }) => {
          if (error) {
            console.error('Audit log write failed:', error);
          }
        })
        .catch(error => {
          console.error('Audit middleware error:', error);
        });
    }

    return originalJson(body);
  };

  next();
}

module.exports = auditMiddleware;
