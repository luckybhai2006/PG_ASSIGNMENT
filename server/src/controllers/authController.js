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
    const {
      name,
      email,
      password,
      phone,
      pgName,
      pgAddress,
      pgPhone,
      pgType = 'boys',
      curfewTime,
      wardenPhone,
    } = req.body;

    if (!name || !email || !password || !pgName || !pgAddress) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, email, password, pgName, pgAddress)',
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
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'owner',
      phone: phone ? phone.trim() : '',
      inviteStatus: 'accepted',
    });
    await owner.save();

    // 2. Tailored Rules for Boys vs Girls PG
    const cleanPgType = ['boys', 'girls', 'co-ed'].includes(pgType) ? pgType : 'boys';
    const defaultRules = cleanPgType === 'girls'
      ? [
          'Main gate curfew strictly at 9:30 PM.',
          'Male visitors strictly prohibited inside residential floors.',
          'Inform warden prior to night outs with guardian authorization.',
          'Keep common areas and study rooms quiet after 11:00 PM.',
        ]
      : [
          'Main gate closes at 10:30 PM.',
          'Keep rooms and common areas clean; turn off appliances when leaving.',
          'Visitors allowed only in ground-floor lounge until 8:00 PM.',
          'No smoking or substance consumption on premises.',
        ];

    // 3. Create PG
    const pg = new PG({
      name: pgName.trim(),
      address: pgAddress.trim(),
      ownerId: owner._id,
      contactPhone: pgPhone ? pgPhone.trim() : (phone ? phone.trim() : ''),
      pgType: cleanPgType,
      curfewTime: curfewTime ? curfewTime.trim() : (cleanPgType === 'girls' ? '9:30 PM' : '10:30 PM'),
      wardenPhone: wardenPhone ? wardenPhone.trim() : '',
      rules: defaultRules,
      noticeBoard: [
        {
          title: `Welcome to ${pgName.trim()} (${cleanPgType === 'girls' ? 'Girls PG' : cleanPgType === 'boys' ? 'Boys PG' : 'Co-Ed PG'})`,
          message: 'Please raise any room or amenity complaints here for prompt resolution.',
          priority: 'normal',
          postedBy: owner._id,
        },
      ],
    });
    await pg.save();

    // 4. Link PG to owner
    owner.pgId = pg._id;
    await owner.save();

    const token = generateToken(owner._id);

    return res.status(201).json({
      success: true,
      message: `Owner and ${cleanPgType === 'girls' ? 'Girls PG' : 'Boys PG'} registered successfully`,
      token,
      user: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        role: owner.role,
        gender: owner.gender,
        phone: owner.phone,
        pgId: owner.pgId,
        inviteStatus: owner.inviteStatus,
      },
      pg,
      myPGs: [pg],
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
      const pgDoc = await PG.findById(user.pgId);
      if (pgDoc) {
        const tenantCount = await User.countDocuments({ pgId: user.pgId, role: 'tenant' });
        const pgData = pgDoc.toObject();
        pgData.tenantCount = tenantCount;
        pg = pgData;
      }
    }

    // Notice if editor has not yet accepted invite, or tenant awaiting approval
    const needsInviteAcceptance =
      user.role === 'editor' && user.inviteStatus === 'pending';
    const needsTenantApproval =
      user.role === 'tenant' && user.inviteStatus !== 'accepted';

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      needsInviteAcceptance,
      needsTenantApproval,
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
      const pgDoc = await PG.findById(user.pgId);
      if (pgDoc) {
        const tenantCount = await User.countDocuments({ pgId: user.pgId, role: 'tenant' });
        const pgData = pgDoc.toObject();
        pgData.tenantCount = tenantCount;
        pg = pgData;
      }
    }

    let myPGs = [];
    if (user.role === 'owner') {
      myPGs = await PG.find({ ownerId: user._id })
        .select('name address pgType joinCode contactPhone curfewTime wardenPhone createdAt')
        .sort({ createdAt: 1 });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        gender: user.gender,
        roomNumber: user.roomNumber,
        phone: user.phone,
        pgId: user.pgId,
        inviteStatus: user.inviteStatus,
      },
      pg,
      myPGs,
      needsInviteAcceptance:
        user.role === 'editor' && user.inviteStatus === 'pending',
      needsTenantApproval:
        user.role === 'tenant' && user.inviteStatus !== 'accepted',
    });
  } catch (error) {
    console.error('GetMe Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get all listed PGs (with optional gender filtering for student signup)
// @route   GET /api/auth/pgs
// @access  Public
exports.getPublicPGs = async (req, res) => {
  try {
    const { pgType } = req.query;

    let filter = {};
    if (pgType && ['boys', 'girls'].includes(pgType.toLowerCase())) {
      filter = {
        $or: [{ pgType: pgType.toLowerCase() }, { pgType: 'co-ed' }],
      };
    }

    const pgs = await PG.find(filter)
      .select('name address contactPhone ownerId createdAt pgType curfewTime wardenPhone')
      .populate('ownerId', 'name email phone')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: pgs.length,
      pgs,
    });
  } catch (error) {
    console.error('Get Public PGs Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching listed PGs',
    });
  }
};

// @desc    Register a new Student/Tenant for a selected PG with gender safety
// @route   POST /api/auth/register-tenant
// @access  Public
exports.registerTenant = async (req, res) => {
  try {
    const { name, email, password, roomNumber, phone, pgId, joinCode, gender } = req.body;

    if (!name || !email || !password || !pgId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and select a PG',
      });
    }

    if (!joinCode || !joinCode.trim()) {
      return res.status(400).json({
        success: false,
        message: 'PG Secret Join Code is required to enroll into this PG',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    const pg = await PG.findById(pgId);
    if (!pg) {
      return res.status(404).json({
        success: false,
        message: 'Selected PG not found',
      });
    }

    // Gender vs PG Type Hard Security Check
    const cleanGender = (gender || 'male').toLowerCase();
    const facilityType = pg.pgType || 'boys';

    if (facilityType === 'girls' && cleanGender === 'male') {
      return res.status(403).json({
        success: false,
        message: `Enrollment Blocked: ${pg.name} is strictly a Girls PG facility. Male student enrollment is prohibited for resident safety.`,
      });
    }

    if (facilityType === 'boys' && cleanGender === 'female') {
      return res.status(403).json({
        success: false,
        message: `Enrollment Blocked: ${pg.name} is strictly a Boys PG facility. Female student enrollment is prohibited.`,
      });
    }

    // Verify secret join code (ignore hyphens, spaces, and case)
    const normalizeCode = (c) => (c || '').replace(/[\s\-_]/g, '').toUpperCase();
    const cleanInput = normalizeCode(joinCode);
    const cleanExpected = normalizeCode(pg.joinCode || 'GH-2024');

    if (cleanInput !== cleanExpected) {
      return res.status(400).json({
        success: false,
        message: `Invalid PG Secret Join Code for ${pg.name}. Please contact your PG Owner or Caretaker for the correct passcode.`,
      });
    }

    const tenant = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'tenant',
      gender: cleanGender,
      roomNumber: (roomNumber && roomNumber.trim()) ? roomNumber.trim().toUpperCase() : 'Unassigned',
      phone: phone ? phone.trim() : '',
      pgId: pg._id,
      invitedBy: pg.ownerId,
      inviteStatus: 'pending', // Awaiting PG Owner Approval
    });

    await tenant.save();

    const token = generateToken(tenant._id);

    return res.status(201).json({
      success: true,
      message: 'Student registered successfully. Awaiting room allocation and approval from PG Owner.',
      token,
      needsTenantApproval: true,
      user: {
        id: tenant._id,
        name: tenant.name,
        email: tenant.email,
        role: tenant.role,
        gender: tenant.gender,
        roomNumber: tenant.roomNumber,
        phone: tenant.phone,
        pgId: tenant.pgId,
        inviteStatus: tenant.inviteStatus,
      },
      pg,
    });
  } catch (error) {
    console.error('Register Tenant Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during student registration',
    });
  }
};

// @desc    Switch active PG for Owner (e.g. Boys Branch ⇄ Girls Branch)
// @route   POST /api/auth/switch-pg
// @access  Private (Owner only)
exports.switchActivePG = async (req, res) => {
  try {
    const { pgId } = req.body;
    if (!pgId) {
      return res.status(400).json({ success: false, message: 'PG ID is required' });
    }

    const pgDoc = await PG.findById(pgId);
    if (!pgDoc) {
      return res.status(404).json({ success: false, message: 'PG facility not found' });
    }

    if (pgDoc.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this PG branch' });
    }

    const user = await User.findById(req.user._id);
    user.pgId = pgDoc._id;
    await user.save();

    const tenantCount = await User.countDocuments({ pgId: pgDoc._id, role: 'tenant' });
    const pgData = pgDoc.toObject();
    pgData.tenantCount = tenantCount;

    const myPGs = await PG.find({ ownerId: user._id })
      .select('name address pgType joinCode contactPhone curfewTime wardenPhone createdAt')
      .sort({ createdAt: 1 });

    const typeLabel = pgDoc.pgType === 'girls' ? 'Girls PG' : pgDoc.pgType === 'boys' ? 'Boys PG' : 'Co-Ed PG';

    return res.json({
      success: true,
      message: `Active branch switched to "${pgDoc.name}" (${typeLabel})`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        gender: user.gender,
        phone: user.phone,
        pgId: user.pgId,
        inviteStatus: user.inviteStatus,
      },
      pg: pgData,
      myPGs,
    });
  } catch (error) {
    console.error('Switch PG Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error switching branch',
    });
  }
};

