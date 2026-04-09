const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const patientModel = require('../models/patientModel');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '24h';
const BCRYPT_ROUNDS = 12;

/**
 * POST /api/auth/register
 * Body: { email, password, first_name, last_name, role, phone?, family_invite_code? }
 */
async function register(req, res) {
  try {
    const { email, password, first_name, last_name, role, phone, family_invite_code } = req.body;

    // Validate required fields
    if (!email || !password || !first_name || !last_name || !role) {
      return res.status(400).json({ error: 'Missing required fields: email, password, first_name, last_name, role.' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one uppercase letter.' });
    }
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one lowercase letter.' });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one number.' });
    }

    // Validate role
    const validRoles = ['patient', 'caregiver', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    // Check if email already exists
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Look up role_id
    const roleRecord = await userModel.findRoleByName(role);
    if (!roleRecord) {
      return res.status(500).json({ error: 'Role not found in database.' });
    }

    // Handle family invite code
    let family_id = null;
    if (family_invite_code) {
      const { supabase } = require('../config/supabase');
      const { data: family, error } = await supabase
        .from('families')
        .select('id')
        .eq('invite_code', family_invite_code)
        .single();

      if (error || !family) {
        return res.status(400).json({ error: 'Invalid family invite code.' });
      }
      family_id = family.id;
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create user
    const user = await userModel.create({
      role_id: roleRecord.id,
      family_id,
      email,
      password_hash,
      first_name,
      last_name,
      phone: phone || null,
    });

    // Auto-create patient profile if role is 'patient' and family is assigned
    let patient = null;
    if (role === 'patient' && family_id) {
      try {
        patient = await patientModel.create({
          user_id: user.id,
          family_id,
          date_of_birth: req.body.date_of_birth || '2000-01-01',
          gender: req.body.gender || null,
          blood_type: req.body.blood_type || null,
        });
      } catch (patientErr) {
        console.error('Auto-create patient profile error:', patientErr);
        // Non-fatal: user is created, patient profile can be completed later
      }
    }

    // Generate JWT
    const token = jwt.sign(
      {
        user_id: user.id,
        role: user.roles.name,
        family_id: user.family_id,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.roles.name,
        family_id: user.family_id,
        patient_id: patient ? patient.id : null,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user
    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated. Contact an administrator.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Update last login
    await userModel.updateLastLogin(user.id);

    // Generate JWT
    const token = jwt.sign(
      {
        user_id: user.id,
        role: user.roles.name,
        family_id: user.family_id,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.roles.name,
        family_id: user.family_id,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile.
 */
async function getMe(req, res) {
  try {
    const user = await userModel.findById(req.user.user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      role: user.roles.name,
      family_id: user.family_id,
      is_active: user.is_active,
      created_at: user.created_at,
    });
  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  register,
  login,
  getMe,
};
