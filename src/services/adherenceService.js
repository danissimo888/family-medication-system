const { supabase } = require('../config/supabase');

const VALID_PERIODS = {
  '7d': 7,
  '30d': 30
};

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function resolveDateRange(period) {
  const days = VALID_PERIODS[period];

  if (!days) {
    const error = new Error('Invalid period. Supported values: 7d, 30d');
    error.statusCode = 400;
    throw error;
  }

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));

  return {
    period,
    days,
    startDate: formatDate(start),
    endDate: formatDate(end)
  };
}

async function calculatePatientAdherence(patientId, period = '7d') {
  const { startDate, endDate, days } = resolveDateRange(period);

  const { data, error } = await supabase
    .from('medication_schedules')
    .select('status')
    .eq('patient_id', patientId)
    .gte('scheduled_date', startDate)
    .lte('scheduled_date', endDate);

  if (error) throw error;

  const schedules = data || [];
  const totalDoses = schedules.length;
  const takenDoses = schedules.filter(schedule => schedule.status === 'taken').length;
  const skippedDoses = schedules.filter(schedule => schedule.status === 'skipped').length;
  const missedDoses = schedules.filter(schedule => schedule.status === 'missed').length;
  const pendingDoses = schedules.filter(schedule => schedule.status === 'pending').length;
  const adherencePercentage = totalDoses === 0 ? 0 : Math.round((takenDoses / totalDoses) * 100);

  return {
    period,
    days,
    start_date: startDate,
    end_date: endDate,
    taken_doses: takenDoses,
    skipped_doses: skippedDoses,
    missed_doses: missedDoses,
    pending_doses: pendingDoses,
    total_doses: totalDoses,
    adherence_percentage: adherencePercentage
  };
}

module.exports = {
  calculatePatientAdherence
};
