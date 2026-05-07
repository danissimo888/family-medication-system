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
    const { brand_name, generic_name, category, description, dosage_form, strength, manufacturer, side_effects } = req.body;

    if (!brand_name || !generic_name || !dosage_form || !strength) {
      return res.status(400).json({ error: 'Brand name, generic name, dosage form, and strength are required' });
    }

    const medicationData = {
      brand_name,
      generic_name,
      category,
      dosage_form,
      strength,
      manufacturer,
      description,
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
    const { brand_name, generic_name, category, dosage_form, strength, manufacturer, description, side_effects } = req.body;

    const medicationData = {
      brand_name,
      generic_name,
      category,
      dosage_form,
      strength,
      manufacturer,
      description,
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
