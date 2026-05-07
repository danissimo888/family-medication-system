const scheduleModel = require('../models/scheduleModel');

/**
 * Generate medication schedules from a prescription item
 * @param {number} prescriptionItemId - The prescription item ID
 * @param {number} patientId - The patient ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD) or null for ongoing
 */
async function generate(prescriptionItemId, patientId, startDate, endDate, scheduleTimes, frequency) {
  if (!frequency) {
    const { data: item, error } = await require('../config/supabase').supabase
      .from('prescription_items')
      .select('frequency')
      .eq('id', prescriptionItemId)
      .single();
    if (error) throw error;
    frequency = item.frequency;
  }

  frequency = frequency.toLowerCase();
  const schedules = [];

  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  const durationDays = end ? Math.ceil((end - start) / (1000 * 60 * 60 * 24)) : 30;

  const defaultTimes = {
    once_daily: ['08:00:00'],
    twice_daily: ['08:00:00', '20:00:00'],
    three_times_daily: ['08:00:00', '14:00:00', '20:00:00'],
    four_times_daily: ['08:00:00', '12:00:00', '16:00:00', '20:00:00'],
    every_other_day: ['08:00:00'],
    weekly: ['08:00:00']
  };

  const freqKey = frequency.replace(/ /g, '_');
  let times;
  if (scheduleTimes && scheduleTimes.length > 0) {
    times = scheduleTimes.map(t => t.length === 5 ? t + ':00' : t);
  } else {
    times = defaultTimes[freqKey] || defaultTimes[frequency] || ['08:00:00'];
  }

  const isEveryOtherDay = frequency.includes('every other day') || freqKey === 'every_other_day';
  const isWeekly = frequency.includes('weekly') || freqKey === 'weekly';
  const step = isEveryOtherDay ? 2 : isWeekly ? 7 : 1;

  for (let day = 0; day <= durationDays; day += step) {
    const scheduleDate = new Date(start);
    scheduleDate.setDate(start.getDate() + day);
    const dateStr = scheduleDate.toISOString().split('T')[0];
    for (const t of times) {
      schedules.push({
        prescription_item_id: prescriptionItemId,
        patient_id: patientId,
        scheduled_date: dateStr,
        scheduled_time: t,
        status: 'pending'
      });
    }
  }

  // Batch insert schedules
  if (schedules.length > 0) {
    await scheduleModel.createBatch(schedules);
  }

  return schedules.length;
}

module.exports = {
  generate
};
