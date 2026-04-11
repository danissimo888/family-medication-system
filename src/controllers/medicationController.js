const medicationModel = require('../models/medicationModel');

/**
 * GET /api/medications - List all medications with optional search
 */
async function list(req, res) {
  try {
    const { search } = req.query;
    const medications = await medicationModel.findAll(search);
    res.json(medications);
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ error: 'Failed to fetch medications' });
  }
}

/**
 * GET /api/medications/:id - Get single medication
 */
async function getById(req, res) {
  try {
    const { id } = req.params;
    const medication = await medicationModel.findById(id);

    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    res.json(medication);
  } catch (error) {
    console.error('Error fetching medication:', error);
    res.status(500).json({ error: 'Failed to fetch medication' });
  }
}

/**
 * POST /api/medications - Create new medication (admin only)
 */
async function create(req, res) {
  try {
    const { name, generic_name, description, common_dosages, side_effects } = req.body;

    // Validation
    if (!name || !generic_name) {
      return res.status(400).json({ error: 'Name and generic name are required' });
    }

    const medicationData = {
      name,
      generic_name,
      description,
      common_dosages,
      side_effects,
      is_active: true
    };

    const medication = await medicationModel.create(medicationData);
    res.status(201).json(medication);
  } catch (error) {
    console.error('Error creating medication:', error);
    res.status(500).json({ error: 'Failed to create medication' });
  }
}

/**
 * PUT /api/medications/:id - Update medication (admin only)
 */
async function update(req, res) {
  try {
    const { id } = req.params;
    const { name, generic_name, description, common_dosages, side_effects } = req.body;

    const medicationData = {
      name,
      generic_name,
      description,
      common_dosages,
      side_effects
    };

    // Remove undefined fields
    Object.keys(medicationData).forEach(key =>
      medicationData[key] === undefined && delete medicationData[key]
    );

    const medication = await medicationModel.update(id, medicationData);
    res.json(medication);
  } catch (error) {
    console.error('Error updating medication:', error);
    res.status(500).json({ error: 'Failed to update medication' });
  }
}

/**
 * DELETE /api/medications/:id - Soft delete medication (admin only)
 */
async function remove(req, res) {
  try {
    const { id } = req.params;
    const medication = await medicationModel.softDelete(id);
    res.json({ message: 'Medication deactivated successfully', medication });
  } catch (error) {
    console.error('Error deleting medication:', error);
    res.status(500).json({ error: 'Failed to delete medication' });
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove
};
