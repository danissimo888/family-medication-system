const allergyModel = require('../models/allergyModel');
const interactionModel = require('../models/interactionModel');
const prescriptionModel = require('../models/prescriptionModel');

/**
 * Check for drug-drug interactions
 * @param {number} patientId - Patient ID
 * @param {number[]} newMedicationIds - Array of new medication IDs to check
 * @returns {Promise<Array>} Array of interaction warnings
 */
async function checkInteractions(patientId, newMedicationIds) {
  try {
    // Get patient's active prescriptions
    const activePrescriptions = await prescriptionModel.findActiveByPatient(patientId);

    // Extract all medication IDs from active prescriptions
    const activeMedicationIds = activePrescriptions.flatMap(p =>
      (p.prescription_items || []).map(item => item.medication_id)
    );

    // Combine active medications with new medications
    const allMedicationIds = [...new Set([...activeMedicationIds, ...newMedicationIds])];

    // If less than 2 medications total, no interactions possible
    if (allMedicationIds.length < 2) {
      return [];
    }

    // Check for interactions
    const interactions = await interactionModel.checkInteractions(allMedicationIds);

    // Filter to only include interactions involving at least one new medication
    const relevantInteractions = interactions.filter(interaction => {
      return newMedicationIds.includes(interaction.medication_id_1) ||
             newMedicationIds.includes(interaction.medication_id_2);
    });

    // Format warnings
    return relevantInteractions.map(interaction => ({
      type: 'interaction',
      severity: interaction.severity,
      medication_1: interaction.med1.generic_name,
      medication_2: interaction.med2.generic_name,
      message: interaction.description
    }));
  } catch (error) {
    console.error('Error checking interactions:', error);
    throw error;
  }
}

/**
 * Check for patient allergies
 * @param {number} patientId - Patient ID
 * @param {number[]} medicationIds - Array of medication IDs to check
 * @returns {Promise<Array>} Array of allergy warnings
 */
async function checkAllergies(patientId, medicationIds) {
  try {
    // Check if patient has allergies to any of the medications
    const allergies = await allergyModel.checkAllergies(patientId, medicationIds);

    // Format warnings
    return allergies.map(allergy => ({
      type: 'allergy',
      severity: allergy.severity,
      medication: allergy.medication ? allergy.medication.generic_name : allergy.allergen_name,
      message: allergy.reaction || 'Patient has documented allergy to this medication'
    }));
  } catch (error) {
    console.error('Error checking allergies:', error);
    throw error;
  }
}

/**
 * Run all safety checks for a prescription
 * @param {number} patientId - Patient ID
 * @param {number[]} medicationIds - Array of medication IDs to check
 * @returns {Promise<Object>} Object with warnings array and safe boolean
 */
async function runSafetyChecks(patientId, medicationIds) {
  try {
    const [interactionWarnings, allergyWarnings] = await Promise.all([
      checkInteractions(patientId, medicationIds),
      checkAllergies(patientId, medicationIds)
    ]);

    const allWarnings = [...interactionWarnings, ...allergyWarnings];

    return {
      safe: allWarnings.length === 0,
      warnings: allWarnings,
      hasHighSeverity: allWarnings.some(w => w.severity === 'high'),
      hasModerateSeverity: allWarnings.some(w => w.severity === 'moderate')
    };
  } catch (error) {
    console.error('Error running safety checks:', error);
    throw error;
  }
}

module.exports = {
  checkInteractions,
  checkAllergies,
  runSafetyChecks
};
