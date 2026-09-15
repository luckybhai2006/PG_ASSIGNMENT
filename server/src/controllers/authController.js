const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PG = require('../models/PG');

// Helper to create JWT
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'pg_complaint_management_secret_key_2026_super_secure',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new Owner and their PG
// @route   POST /api/auth/register-owner
// @access  Public
exports.registerOwner = async (req, res) => {
  try {
    const { name, email, password, phone, pgName, pgAddress, pgPhone } = req.body;

    if (!name || !email || !password || !pgName || !pgAddress) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, PG name, and PG address',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // 1. Create Owner User
    const owner = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: 'owner',
      phone: phone || '',
      inviteStatus: 'accepted',
    });
    await owner.save();

    // 2. Create PG
    const pg = new PG({
      name: pgName,
      address: pgAddress,
      ownerId: owner._id,
      contactPhone: pgPhone || phone || '',
      rules: [
        'Gate closes at 10:30 PM.',
        'Keep common areas clean and switch off appliances when not in use.',
        'Visitors allowed in lounge area until 8:00 PM.',
      ],
      noticeBoard: [
        {
          title: 'Welcome to your PG Complaint Portal!',
          message: 'Please raise any room or amenity complaints here for prompt resolution.',
          priority: 'normal',
          postedBy: owner._id,
        },
      ],
    });
    await pg.save();

    // 3. Link PG to owner
    owner.pgId = pg._id;
    await owner.save();

    const token = generateToken(owner._id);

    return res.status(201).json({
      success: true,
      message: 'Owner and PG registered successfully',
      token,
      user: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        role: owner.role,
        phone: owner.phone,
        pgId: owner.pgId,
        inviteStatus: owner.inviteStatus,
      },
      pg: {
        id: pg._id,
        name: pg.name,
        address: pg.address,
        contactPhone: pg.contactPhone,
      },
    });
  } catch (error) {
    console.error('Register Owner Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    });
  }
};

// @desc    Login user (Owner, Editor, Tenant)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id);

    // Fetch PG info if associated
    let pg = null;
    if (user.pgId) {
      pg = await PG.findById(user.pgId);
    }

    // Notice if editor has not yet accepted invite
    const needsInviteAcceptance =
      user.role === 'editor' && user.inviteStatus === 'pending';

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      needsInviteAcceptance,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roomNumber: user.roomNumber,
        phone: user.phone,
        pgId: user.pgId,
        inviteStatus: user.inviteStatus,
      },
      pg: pg
        ? {
          id: pg._id,
          name: pg.name,
          address: pg.address,
          contactPhone: pg.contactPhone,
        }
        : null,
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
};

// @desc    Get current logged in user & PG data
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let pg = null;
    if (user.pgId) {
      pg = await PG.findById(user.pgId);
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roomNumber: user.roomNumber,
        phone: user.phone,
        pgId: user.pgId,
        inviteStatus: user.inviteStatus,
      },
      pg,
      needsInviteAcceptance:
        user.role === 'editor' && user.inviteStatus === 'pending',
    });
  } catch (error) {
    console.error('GetMe Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
