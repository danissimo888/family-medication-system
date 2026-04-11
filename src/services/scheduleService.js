const scheduleModel = require('../models/scheduleModel');

/**
 * Generate medication schedules from a prescription item
 * @param {number} prescriptionItemId - The prescription item ID
 * @param {number} patientId - The patient ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD) or null for ongoing
 */
async function generate(prescriptionItemId, patientId, startDate, endDate) {
  const { data: item, error } = await require('../config/supabase').supabase
    .from('prescription_items')
    .select('frequency')
    .eq('id', prescriptionItemId)
    .single();

  if (error) throw error;

  const frequency = item.frequency.toLowerCase();
  const schedules = [];

  // Parse frequency and generate schedule slots
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  // Calculate duration in days (default to 30 days if no end date)
  const durationDays = end ? Math.ceil((end - start) / (1000 * 60 * 60 * 24)) : 30;

  // Generate schedules based on frequency
  if (frequency.includes('once daily') || frequency.includes('1x daily') || frequency === 'once_daily') {
    // Once daily at 8:00 AM
    for (let day = 0; day <= durationDays; day++) {
      const scheduleDate = new Date(start);
      scheduleDate.setDate(start.getDate() + day);
      schedules.push({
        prescription_item_id: prescriptionItemId,
        patient_id: patientId,
        scheduled_date: scheduleDate.toISOString().split('T')[0],
        scheduled_time: '08:00:00',
        status: 'pending'
      });
    }
  } else if (frequency.includes('twice daily') || frequency.includes('2x daily') || frequency === 'twice_daily') {
    // Twice daily at 8:00 AM and 8:00 PM
    for (let day = 0; day <= durationDays; day++) {
      const scheduleDate = new Date(start);
      scheduleDate.setDate(start.getDate() + day);
      const dateStr = scheduleDate.toISOString().split('T')[0];
      schedules.push({
        prescription_item_id: prescriptionItemId,
        patient_id: patientId,
        scheduled_date: dateStr,
        scheduled_time: '08:00:00',
        status: 'pending'
      });
      schedules.push({
        prescription_item_id: prescriptionItemId,
        patient_id: patientId,
        scheduled_date: dateStr,
        scheduled_time: '20:00:00',
        status: 'pending'
      });
    }
  } else if (frequency.includes('three times daily') || frequency.includes('3x daily') || frequency === 'three_times_daily') {
    // Three times daily at 8:00 AM, 2:00 PM, 8:00 PM
    for (let day = 0; day <= durationDays; day++) {
      const scheduleDate = new Date(start);
      scheduleDate.setDate(start.getDate() + day);
      const dateStr = scheduleDate.toISOString().split('T')[0];
      schedules.push({
        prescription_item_id: prescriptionItemId,
        patient_id: patientId,
        scheduled_date: dateStr,
        scheduled_time: '08:00:00',
        status: 'pending'
      });
      schedules.push({
        prescription_item_id: prescriptionItemId,
        patient_id: patientId,
        scheduled_date: dateStr,
        scheduled_time: '14:00:00',
        status: 'pending'
      });
      schedules.push({
        prescription_item_id: prescriptionItemId,
        patient_id: patientId,
        scheduled_date: dateStr,
        scheduled_time: '20:00:00',
        status: 'pending'
      });
    }
  } else if (frequency.includes('every other day') || frequency === 'every_other_day') {
    // Every other day at 8:00 AM
    for (let day = 0; day <= durationDays; day += 2) {
      const scheduleDate = new Date(start);
      scheduleDate.setDate(start.getDate() + day);
      schedules.push({
        prescription_item_id: prescriptionItemId,
        patient_id: patientId,
        scheduled_date: scheduleDate.toISOString().split('T')[0],
        scheduled_time: '08:00:00',
        status: 'pending'
      });
    }
  } else if (frequency.includes('weekly') || frequency === 'weekly') {
    // Weekly at 8:00 AM
    for (let week = 0; week * 7 <= durationDays; week++) {
      const scheduleDate = new Date(start);
      scheduleDate.setDate(start.getDate() + (week * 7));
      schedules.push({
        prescription_item_id: prescriptionItemId,
        patient_id: patientId,
        scheduled_date: scheduleDate.toISOString().split('T')[0],
        scheduled_time: '08:00:00',
        status: 'pending'
      });
    }
  } else {
    // Default: once daily
    for (let day = 0; day <= durationDays; day++) {
      const scheduleDate = new Date(start);
      scheduleDate.setDate(start.getDate() + day);
      schedules.push({
        prescription_item_id: prescriptionItemId,
        patient_id: patientId,
        scheduled_date: scheduleDate.toISOString().split('T')[0],
        scheduled_time: '08:00:00',
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
