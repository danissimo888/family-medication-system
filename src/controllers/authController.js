const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const patientModel = require('../models/patientModel');
const { supabase } = require('../config/supabase');
const loginProtection = require('../services/loginProtectionService');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '24h';
const BCRYPT_ROUNDS = 12;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register
async function register(req, res) {
  try {
    const { email, password, first_name, last_name, role, phone, family_invite_code } = req.body;

    // Validate required fields
    if (!email || !password || !first_name || !last_name || !role) {
      return res.status(400).json({ error: 'Missing required fields: email, password, first_name, last_name, role.' });
    }

    // Validate email format
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    // Prevent self-registration as admin
    if (role === 'admin') {
      return res.status(403).json({ error: 'Admin accounts cannot be created via registration.' });
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
    const validRoles = ['patient', 'caregiver'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    // Caregivers MUST provide family invite code
    if (role === 'caregiver' && !family_invite_code) {
      return res.status(400).json({ error: 'Caregivers must provide a family invite code.' });
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
      family_id: role === 'caregiver' ? null : family_id,
      email,
      password_hash,
      first_name,
      last_name,
      phone: phone || null,
    });

    // Auto-create patient profile if role is 'patient'
    let patient = null;
    if (role === 'patient') {
      // Create family for patient if they don't have one
      if (!family_id) {
        const familyModel = require('../models/familyModel');
        const family = await familyModel.create({
          name: `${first_name} ${last_name}'s Family`,
          created_by: user.id,
        });
        family_id = family.id;

        // Update user's family_id
        await supabase
          .from('users')
          .update({ family_id: family.id, updated_at: new Date().toISOString() })
          .eq('id', user.id);

        // CRITICAL: Refetch user to get updated family_id for JWT
        const updatedUser = await userModel.findById(user.id);
        if (updatedUser) {
          user.family_id = updatedUser.family_id;
        }
      }

      patient = await patientModel.create({
        user_id: user.id,
        family_id,
        date_of_birth: req.body.date_of_birth || '2000-01-01',
        gender: req.body.gender || null,
        blood_type: req.body.blood_type || null,
      });
    }

    // For caregivers with invite code: add to caregiver_families junction table
    if (role === 'caregiver' && family_id) {
      const { error: junctionError } = await supabase
        .from('caregiver_families')
        .insert({ user_id: user.id, family_id: family_id });

      if (junctionError) {
        console.error('Failed to add caregiver to family:', junctionError);
      }

      // Set user's primary family_id
      await supabase
        .from('users')
        .update({ family_id: family_id, updated_at: new Date().toISOString() })
        .eq('id', user.id);
    }

    // Generate JWT
    const token = jwt.sign(
      {
        user_id: user.id,
        role: user.roles.name,
        family_id: family_id,
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
        family_id: family_id,
        patient_id: patient ? patient.id : null,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated. Contact an administrator.' });
    }

    // Check account lockout before bcrypt (saves CPU, no timing leak)
    const lockSeconds = loginProtection.getLockoutSecondsRemaining(user);
    if (lockSeconds > 0) {
      return res.status(423).json({
        error: 'Account temporarily locked due to too many failed attempts.',
        locked: true,
        seconds_remaining: lockSeconds,
        locked_until: user.locked_until,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const result = await loginProtection.recordFailedAttempt(user.id);
      const attemptsUsed = result.failed_login_attempts;
      const remaining = loginProtection.MAX_ATTEMPTS - attemptsUsed;

      if (result.locked_until && new Date(result.locked_until) > new Date()) {
        return res.status(423).json({
          error: 'Account temporarily locked due to too many failed attempts.',
          locked: true,
          seconds_remaining: loginProtection.LOCKOUT_MINUTES * 60,
          locked_until: result.locked_until,
        });
      }

      return res.status(401).json({
        error: 'Invalid email or password.',
        attempts_remaining: Math.max(0, remaining),
      });
    }

    // Success — clear any failed attempts
    await loginProtection.resetFailedAttempts(user.id);
    await userModel.updateLastLogin(user.id);

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

// GET /api/auth/me - returns the logged-in user's profile
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
