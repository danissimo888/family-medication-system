const scheduleModel = require('../models/scheduleModel');
const notificationService = require('./notificationService');
const patientModel = require('../models/patientModel');
const { supabase } = require('../config/supabase');

/**
 * Check for upcoming doses and send reminders 10 minutes before scheduled time
 */
async function checkUpcomingDoses() {
  try {
    const now = new Date();
    const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);

    const currentDate = now.toISOString().split('T')[0];
    const targetTime = tenMinutesLater.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

    console.log(`[ReminderScheduler] Checking for doses at ${currentDate} ${targetTime}`);

    // Query schedules that are:
    // 1. Scheduled for today
    // 2. Scheduled time matches target time (10 min from now)
    // 3. Status is pending
    const { data: schedules, error } = await supabase
      .from('medication_schedules')
      .select(`
        id,
        patient_id,
        scheduled_date,
        scheduled_time,
        status,
        prescription_items (
          medications (
            generic_name,
            brand_name
          )
        )
      `)
      .eq('scheduled_date', currentDate)
      .eq('scheduled_time', targetTime + ':00')
      .eq('status', 'pending');

    if (error) {
      console.error('[ReminderScheduler] Query error:', error);
      return;
    }

    if (!schedules || schedules.length === 0) {
      console.log('[ReminderScheduler] No upcoming doses found');
      return;
    }

    console.log(`[ReminderScheduler] Found ${schedules.length} upcoming doses`);

    // Create reminder notification for each schedule
    for (const schedule of schedules) {
      try {
        const patient = await patientModel.findById(schedule.patient_id);
        if (!patient || !patient.user_id) {
          console.warn(`[ReminderScheduler] Patient not found for schedule ${schedule.id}`);
          continue;
        }

        const medName = schedule.prescription_items?.medications?.generic_name
          || schedule.prescription_items?.medications?.brand_name
          || 'medication';

        await notificationService.createDoseReminder(patient.user_id, {
          medication_name: medName,
          scheduled_time: schedule.scheduled_time,
          schedule_id: schedule.id
        });

        console.log(`[ReminderScheduler] Reminder sent for schedule ${schedule.id} to user ${patient.user_id}`);
      } catch (notifError) {
        console.error(`[ReminderScheduler] Failed to send reminder for schedule ${schedule.id}:`, notifError);
      }
    }
  } catch (error) {
    console.error('[ReminderScheduler] Error in checkUpcomingDoses:', error);
  }
}

/**
 * Start the reminder scheduler (runs every minute)
 */
function start() {
  console.log('[ReminderScheduler] Starting reminder scheduler (checks every minute)');

  // Run immediately on start
  checkUpcomingDoses();

  // Then run every minute
  setInterval(checkUpcomingDoses, 60 * 1000);
}

module.exports = {
  start,
  checkUpcomingDoses
};
