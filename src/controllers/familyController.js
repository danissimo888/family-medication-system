const familyModel = require('../models/familyModel');
const { supabase } = require('../config/supabase');
const jwt = require('jsonwebtoken');

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
    let hasAccess = req.user.role === 'admin' || req.user.family_id === id;

    if (!hasAccess && req.user.role === 'caregiver') {
      const { data: membership } = await supabase
        .from('caregiver_families')
        .select('id')
        .eq('user_id', req.user.user_id)
        .eq('family_id', id)
        .maybeSingle();
      hasAccess = !!membership;
    }

    if (!hasAccess) {
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
 * Caregivers: adds to caregiver_families junction table (multi-family).
 * Patients: sets users.family_id directly (single family).
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

    if (req.user.role === 'caregiver') {
      const { data: existing } = await supabase
        .from('caregiver_families')
        .select('id')
        .eq('user_id', req.user.user_id)
        .eq('family_id', family.id)
        .maybeSingle();

      if (existing) {
        return res.status(409).json({ error: 'You are already a member of this family.' });
      }

      const { error: junctionError } = await supabase
        .from('caregiver_families')
        .insert({ user_id: req.user.user_id, family_id: family.id });

      if (junctionError) throw junctionError;

      if (!req.user.family_id) {
        await supabase
          .from('users')
          .update({ family_id: family.id, updated_at: new Date().toISOString() })
          .eq('id', req.user.user_id);
      }
    } else {
      const { error: updateError } = await supabase
        .from('users')
        .update({ family_id: family.id, updated_at: new Date().toISOString() })
        .eq('id', req.user.user_id);

      if (updateError) throw updateError;

      if (req.user.role === 'patient') {
        const { error: patientError } = await supabase
          .from('patients')
          .update({ family_id: family.id, updated_at: new Date().toISOString() })
          .eq('user_id', req.user.user_id);

        if (patientError && patientError.code !== 'PGRST116') throw patientError;
      }
    }

    const primaryFamilyId = req.user.family_id || family.id;
    const token = jwt.sign(
      { user_id: req.user.user_id, role: req.user.role, family_id: primaryFamilyId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Successfully joined family.',
      token,
      family: { id: family.id, name: family.name },
    });
  } catch (err) {
    console.error('Join family error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * GET /api/families/my-code
 * Get family code for current user (patients only).
 */
async function getMyFamilyCode(req, res) {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Only patients can generate family codes.' });
    }

    const family_id = req.user.family_id;

    if (!family_id) {
      return res.status(400).json({
        error: 'No family found. Please contact support.'
      });
    }

    const family = await familyModel.findById(family_id);

    if (!family) {
      return res.status(404).json({ error: 'Family not found.' });
    }

    res.json({
      family_id: family.id,
      name: family.name,
      invite_code: family.invite_code,
    });
  } catch (err) {
    console.error('Get my family code error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * POST /api/families/leave
 * Leave a specific family (caregivers only).
 * Body: { family_id } — required, specifies which family to leave.
 */
async function leaveFamily(req, res) {
  try {
    if (req.user.role !== 'caregiver') {
      return res.status(403).json({ error: 'Only caregivers can leave families.' });
    }

    const { family_id } = req.body;
    if (!family_id) {
      return res.status(400).json({ error: 'family_id is required.' });
    }

    const { data: membership } = await supabase
      .from('caregiver_families')
      .select('id')
      .eq('user_id', req.user.user_id)
      .eq('family_id', family_id)
      .maybeSingle();

    if (!membership) {
      return res.status(400).json({ error: 'You are not a member of this family.' });
    }

    const { error: deleteError } = await supabase
      .from('caregiver_families')
      .delete()
      .eq('user_id', req.user.user_id)
      .eq('family_id', family_id);

    if (deleteError) throw deleteError;

    let newPrimaryFamilyId = req.user.family_id;
    if (req.user.family_id === family_id) {
      const { data: remaining } = await supabase
        .from('caregiver_families')
        .select('family_id')
        .eq('user_id', req.user.user_id)
        .limit(1);

      newPrimaryFamilyId = (remaining && remaining.length > 0) ? remaining[0].family_id : null;

      await supabase
        .from('users')
        .update({ family_id: newPrimaryFamilyId, updated_at: new Date().toISOString() })
        .eq('id', req.user.user_id);
    }

    const token = jwt.sign(
      { user_id: req.user.user_id, role: req.user.role, family_id: newPrimaryFamilyId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ message: 'Successfully left family.', token });
  } catch (err) {
    console.error('Leave family error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * GET /api/families/my-families
 * Returns all families the caregiver belongs to (via junction table).
 */
async function getMyCaregiverFamilies(req, res) {
  try {
    if (req.user.role !== 'caregiver') {
      return res.status(403).json({ error: 'Only caregivers can access this endpoint.' });
    }

    const { data, error } = await supabase
      .from('caregiver_families')
      .select('family_id, joined_at, families(id, name, invite_code)')
      .eq('user_id', req.user.user_id)
      .order('joined_at', { ascending: true });

    if (error) throw error;

    const families = (data || []).map(row => ({
      id: row.families.id,
      name: row.families.name,
      invite_code: row.families.invite_code,
      joined_at: row.joined_at,
    }));

    res.json(families);
  } catch (err) {
    console.error('Get caregiver families error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  createFamily,
  getFamily,
  updateFamily,
  joinFamily,
  getMyFamilyCode,
  leaveFamily,
  getMyCaregiverFamilies,
};
