const interactionModel = require('../models/interactionModel');

/**
 * GET /api/interactions - Get all drug interactions (admin only)
 */
async function getAll(req, res) {
  try {
    const interactions = await interactionModel.findAll();
    res.json(interactions);
  } catch (error) {
    console.error('Error fetching interactions:', error);
    res.status(500).json({ error: 'Failed to fetch interactions' });
  }
}

/**
 * GET /api/interactions/:id - Get single interaction by ID
 */
async function getById(req, res) {
  try {
    const { id } = req.params;
    const interaction = await interactionModel.findById(id);

    if (!interaction) {
      return res.status(404).json({ error: 'Interaction not found' });
    }

    res.json(interaction);
  } catch (error) {
    console.error('Error fetching interaction:', error);
    res.status(500).json({ error: 'Failed to fetch interaction' });
  }
}

/**
 * GET /api/interactions/check - Check for interactions among medications
 * Query params: meds=id1,id2,id3
 */
async function checkInteractions(req, res) {
  try {
    const { meds } = req.query;

    if (!meds) {
      return res.status(400).json({ error: 'Medication IDs are required (meds query param)' });
    }

    // Parse comma-separated UUIDs
    const medicationIds = meds.split(',').map(id => id.trim()).filter(Boolean);

    if (medicationIds.length < 2) {
      return res.json({ interactions: [] });
    }

    const interactions = await interactionModel.checkInteractions(medicationIds);
    res.json({ interactions });
  } catch (error) {
    console.error('Error checking interactions:', error);
    res.status(500).json({ error: 'Failed to check interactions' });
  }
}

/**
 * POST /api/interactions - Create new drug interaction (admin only)
 */
async function create(req, res) {
  try {
    const { medication_id_1, medication_id_2, severity, description } = req.body;

    // Validation
    if (!medication_id_1 || !medication_id_2 || !severity || !description) {
      return res.status(400).json({
        error: 'Both medication IDs, severity, and description are required'
      });
    }

    if (medication_id_1 === medication_id_2) {
      return res.status(400).json({
        error: 'Cannot create interaction between the same medication'
      });
    }

    const interactionData = {
      medication_id_1,
      medication_id_2,
      severity,
      description
    };

    const interaction = await interactionModel.create(interactionData);
    res.status(201).json(interaction);
  } catch (error) {
    console.error('Error creating interaction:', error);

    // Handle duplicate interaction
    if (error.code === '23505') {
      return res.status(409).json({ error: 'This drug interaction already exists' });
    }

    res.status(500).json({ error: 'Failed to create interaction' });
  }
}

/**
 * PUT /api/interactions/:id - Update drug interaction (admin only)
 */
async function update(req, res) {
  try {
    const { id } = req.params;
    const { severity, description } = req.body;

    // Verify interaction exists
    const existing = await interactionModel.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Interaction not found' });
    }

    const updateData = {};
    if (severity !== undefined) updateData.severity = severity;
    if (description !== undefined) updateData.description = description;

    const interaction = await interactionModel.update(id, updateData);
    res.json(interaction);
  } catch (error) {
    console.error('Error updating interaction:', error);
    res.status(500).json({ error: 'Failed to update interaction' });
  }
}

/**
 * DELETE /api/interactions/:id - Delete drug interaction (admin only)
 */
async function remove(req, res) {
  try {
    const { id } = req.params;

    // Verify interaction exists
    const existing = await interactionModel.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Interaction not found' });
    }

    await interactionModel.remove(id);
    res.json({ message: 'Interaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting interaction:', error);
    res.status(500).json({ error: 'Failed to delete interaction' });
  }
}

module.exports = {
  getAll,
  getById,
  checkInteractions,
  create,
  update,
  remove
};
