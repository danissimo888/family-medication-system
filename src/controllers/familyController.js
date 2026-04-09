const familyModel = require('../models/familyModel');
const { supabase } = require('../config/supabase');

/**
 * POST /api/families
 * Create a new family. Auto-generates invite code.
 * Body: { name }
 */
async function createFamily(req, res) {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Family name is required.' });
    }

    const family = await familyModel.create({
      name,
      created_by: req.user.user_id,
    });

    // Assign the creating user to this family
    const { error: updateError } = await supabase
      .from('users')
      .update({ family_id: family.id, updated_at: new Date().toISOString() })
      .eq('id', req.user.user_id);

    if (updateError) throw updateError;

    res.status(201).json(family);
  } catch (err) {
    console.error('Create family error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * GET /api/families/:id
 * Get family details + members. Only accessible by family members.
 */
async function getFamily(req, res) {
  try {
    const { id } = req.params;

    const family = await familyModel.findById(id);
    if (!family) {
      return res.status(404).json({ error: 'Family not found.' });
    }

    // Verify the requesting user belongs to this family
    if (req.user.family_id !== id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. You are not a member of this family.' });
    }

    const members = await familyModel.getMembers(id);

    res.json({
      ...family,
      members: members.map(m => ({
        id: m.id,
        email: m.email,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone,
        role: m.roles.name,
      })),
    });
  } catch (err) {
    console.error('Get family error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * PUT /api/families/:id
 * Update family name. Only accessible by the family creator.
 */
async function updateFamily(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Family name is required.' });
    }

    const family = await familyModel.findById(id);
    if (!family) {
      return res.status(404).json({ error: 'Family not found.' });
    }

    // Only the creator can update the family
    if (family.created_by !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Only the family creator can update this family.' });
    }

    const updated = await familyModel.update(id, { name });
    res.json(updated);
  } catch (err) {
    console.error('Update family error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * POST /api/families/join
 * Join a family using an invite code.
 * Body: { invite_code }
 */
async function joinFamily(req, res) {
  try {
    const { invite_code } = req.body;

    if (!invite_code) {
      return res.status(400).json({ error: 'Invite code is required.' });
    }

    const family = await familyModel.findByInviteCode(invite_code);
    if (!family) {
      return res.status(404).json({ error: 'Invalid invite code. Family not found.' });
    }

    // Check if user already belongs to a family
    if (req.user.family_id) {
      return res.status(409).json({ error: 'You already belong to a family. Leave your current family first.' });
    }

    // Update the user's family_id
    const { error: updateError } = await supabase
      .from('users')
      .update({ family_id: family.id, updated_at: new Date().toISOString() })
      .eq('id', req.user.user_id);

    if (updateError) throw updateError;

    // If user is a patient, also update their patient record's family_id
    if (req.user.role === 'patient') {
      const { error: patientError } = await supabase
        .from('patients')
        .update({ family_id: family.id, updated_at: new Date().toISOString() })
        .eq('user_id', req.user.user_id);

      // Ignore error if patient row doesn't exist yet
      if (patientError && patientError.code !== 'PGRST116') throw patientError;
    }

    res.json({
      message: 'Successfully joined family.',
      family: {
        id: family.id,
        name: family.name,
      },
    });
  } catch (err) {
    console.error('Join family error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  createFamily,
  getFamily,
  updateFamily,
  joinFamily,
};
