const notificationModel = require('../models/notificationModel');
const { supabase } = require('../config/supabase');

/**
 * Create a dose reminder notification
 * @param {string} userId - User ID to notify
 * @param {object} scheduleData - Schedule information { medication_name, scheduled_time, schedule_id }
 */
async function createDoseReminder(userId, scheduleData) {
  const { medication_name, scheduled_time, schedule_id } = scheduleData;

  return await notificationModel.create({
    user_id: userId,
    type: 'reminder',
    title: 'Medication Reminder',
    message: `Time to take ${medication_name} at ${scheduled_time}`,
    reference_id: schedule_id
  });
}

/**
 * Create missed dose notifications for patient and caregivers
 * @param {string} patientId - Patient ID
 * @param {object} scheduleData - Schedule information { medication_name, scheduled_time, schedule_id }
 */
async function createMissedDoseNotifications(patientId, scheduleData) {
  const { medication_name, scheduled_time, schedule_id } = scheduleData;

  // Get patient's user_id and family_id
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('user_id, family_id')
    .eq('id', patientId)
    .single();

  if (patientError || !patient) {
    console.error('Error fetching patient for missed dose notification:', patientError);
    return;
  }

  // Notify the patient
  await notificationModel.create({
    user_id: patient.user_id,
    type: 'missed_dose',
    title: 'Missed Dose',
    message: `You missed ${medication_name} scheduled at ${scheduled_time}`,
    reference_id: schedule_id
  });

  // Get all caregivers in the family
  const { data: caregivers, error: caregiversError } = await supabase
    .from('users')
    .select(`
      id,
      first_name,
      last_name,
      roles!inner (
        name
      )
    `)
    .eq('family_id', patient.family_id)
    .eq('roles.name', 'caregiver')
    .eq('is_active', true);

  if (caregiversError) {
    console.error('Error fetching caregivers for missed dose notification:', caregiversError);
    return;
  }

  // Get patient name for caregiver notification
  const { data: patientUser, error: patientUserError } = await supabase
    .from('users')
    .select('first_name, last_name')
    .eq('id', patient.user_id)
    .single();

  const patientName = patientUser ? `${patientUser.first_name} ${patientUser.last_name}` : 'Patient';

  // Notify all caregivers
  for (const caregiver of caregivers) {
    await notificationModel.create({
      user_id: caregiver.id,
      type: 'missed_dose',
      title: 'Patient Missed Dose',
      message: `${patientName} missed ${medication_name} scheduled at ${scheduled_time}`,
      reference_id: schedule_id
    });
  }
}

/**
 * Create safety warning notification
 * @param {string} userId - User ID to notify
 * @param {object} warningData - Warning information { type, severity, description, medication_names }
 */
async function createSafetyWarning(userId, warningData) {
  const { type, severity, description, medication_names } = warningData;

  const title = type === 'interaction' ? 'Drug Interaction Warning' : 'Allergy Warning';
  const message = `${severity.toUpperCase()}: ${description} (${medication_names.join(', ')})`;

  return await notificationModel.create({
    user_id: userId,
    type: 'safety_warning',
    title,
    message,
    reference_id: null
  });
}

/**
 * Create adherence alert notification for caregivers
 * @param {string} patientId - Patient ID
 * @param {number} adherenceRate - Adherence percentage
 * @param {string} period - Period (e.g., '7d', '30d')
 */
async function createAdherenceAlert(patientId, adherenceRate, period) {
  // Get patient's family_id
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('user_id, family_id')
    .eq('id', patientId)
    .single();

  if (patientError || !patient) {
    console.error('Error fetching patient for adherence alert:', patientError);
    return;
  }

  // Get patient name
  const { data: patientUser } = await supabase
    .from('users')
    .select('first_name, last_name')
    .eq('id', patient.user_id)
    .single();

  const patientName = patientUser ? `${patientUser.first_name} ${patientUser.last_name}` : 'Patient';

  // Get all caregivers in the family
  const { data: caregivers, error: caregiversError } = await supabase
    .from('users')
    .select(`
      id,
      roles!inner (
        name
      )
    `)
    .eq('family_id', patient.family_id)
    .eq('roles.name', 'caregiver')
    .eq('is_active', true);

  if (caregiversError) {
    console.error('Error fetching caregivers for adherence alert:', caregiversError);
    return;
  }

  // Notify all caregivers
  for (const caregiver of caregivers) {
    await notificationModel.create({
      user_id: caregiver.id,
      type: 'adherence_alert',
      title: 'Low Adherence Alert',
      message: `${patientName}'s adherence rate is ${adherenceRate.toFixed(1)}% over the last ${period}`,
      reference_id: patientId
    });
  }
}

/**
 * Check for missed doses and create notifications
 * This should be called periodically (e.g., every hour via cron job)
 */
async function checkMissedDoses() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Find schedules that are pending and past their scheduled time by at least 1 hour
  const { data: missedSchedules, error } = await supabase
    .from('medication_schedules')
    .select(`
      id,
      scheduled_time,
      patient_id,
      prescription_items (
        medications (
          name
        )
      )
    `)
    .eq('status', 'pending')
    .lt('scheduled_time', oneHourAgo.toISOString());

  if (error) {
    console.error('Error checking missed doses:', error);
    return;
  }

  // Create notifications for each missed dose
  for (const schedule of missedSchedules) {
    const medicationName = schedule.prescription_items?.medications?.name || 'Unknown medication';

    await createMissedDoseNotifications(schedule.patient_id, {
      medication_name: medicationName,
      scheduled_time: new Date(schedule.scheduled_time).toLocaleString(),
      schedule_id: schedule.id
    });

    // Update schedule status to 'missed'
    await supabase
      .from('medication_schedules')
      .update({ status: 'missed' })
      .eq('id', schedule.id);
  }

  return missedSchedules.length;
}

module.exports = {
  createDoseReminder,
  createMissedDoseNotifications,
  createSafetyWarning,
  createAdherenceAlert,
  checkMissedDoses
};
