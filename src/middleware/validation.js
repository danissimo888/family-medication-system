const VALID_FREQUENCIES = [
  'once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily',
  'every_other_day', 'weekly', 'as_needed'
];

const VALID_SEVERITIES = ['mild', 'moderate', 'severe', 'minor', 'major'];

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(str) {
  if (!ISO_DATE_RE.test(str)) return false;
  const d = new Date(str + 'T00:00:00Z');
  return !isNaN(d.getTime());
}

function isUUID(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function validatePrescriptionInput(req, res, next) {
  const { start_date, end_date, items } = req.body;

  if (start_date && !isValidDate(start_date)) {
    return res.status(400).json({ error: 'Invalid start_date format. Use YYYY-MM-DD.' });
  }

  if (end_date && !isValidDate(end_date)) {
    return res.status(400).json({ error: 'Invalid end_date format. Use YYYY-MM-DD.' });
  }

  if (end_date && start_date && new Date(end_date) < new Date(start_date)) {
    return res.status(400).json({ error: 'end_date must be after start_date.' });
  }

  if (items && Array.isArray(items)) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.frequency && !VALID_FREQUENCIES.includes(item.frequency)) {
        return res.status(400).json({
          error: `Invalid frequency "${item.frequency}" in item ${i + 1}. Valid: ${VALID_FREQUENCIES.join(', ')}`
        });
      }
      if (item.duration_days !== undefined && item.duration_days !== null) {
        const d = Number(item.duration_days);
        if (!Number.isInteger(d) || d < 1 || d > 3650) {
          return res.status(400).json({ error: `Invalid duration_days in item ${i + 1}. Must be 1-3650.` });
        }
      }
    }
  }

  next();
}

function validateAllergyInput(req, res, next) {
  const { severity, medication_id } = req.body;

  if (severity && !VALID_SEVERITIES.includes(severity)) {
    return res.status(400).json({
      error: `Invalid severity "${severity}". Valid: ${VALID_SEVERITIES.join(', ')}`
    });
  }

  if (medication_id && !isUUID(medication_id)) {
    return res.status(400).json({ error: 'Invalid medication_id format.' });
  }

  next();
}

function validateUUIDParam(paramName) {
  return (req, res, next) => {
    const val = req.params[paramName];
    if (val && !isUUID(val)) {
      return res.status(400).json({ error: `Invalid ${paramName} format.` });
    }
    next();
  };
}

module.exports = {
  validatePrescriptionInput,
  validateAllergyInput,
  validateUUIDParam,
  isValidDate,
  isUUID
};
