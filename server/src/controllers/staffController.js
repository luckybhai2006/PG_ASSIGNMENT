const User = require('../models/User');
const PG = require('../models/PG');

// @desc    Invite / Add Editor (Staff Management)
// @route   POST /api/staff/invite
// @access  Private (Owner ONLY)
exports.inviteEditor = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const ownerId = req.user._id;
    const pgId = req.user.pgId;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and temporary password are required',
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    const editor = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'editor',
      pgId,
      phone: phone ? phone.trim() : '',
      invitedBy: ownerId,
      inviteStatus: 'pending', // Must accept invite on first login
    });

    await editor.save();

    return res.status(201).json({
      success: true,
      message: `Staff Editor invite created for ${editor.name}. They will be prompted to accept the invite on login.`,
      editor: {
        id: editor._id,
        name: editor.name,
        email: editor.email,
        role: editor.role,
        phone: editor.phone,
        inviteStatus: editor.inviteStatus,
        createdAt: editor.createdAt,
      },
    });
  } catch (error) {
    console.error('Invite Editor Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Accept Staff Invite (Editor accepts invite)
// @route   PUT /api/staff/accept-invite
// @access  Private (Editor ONLY)
exports.acceptInvite = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user || user.role !== 'editor') {
      return res.status(403).json({
        success: false,
        message: 'Only editors can accept staff invites',
      });
    }

    user.inviteStatus = 'accepted';
    await user.save();

    const pg = await PG.findById(user.pgId);

    return res.json({
      success: true,
      message: 'Staff invite accepted! You now have access to the PG management portal.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        pgId: user.pgId,
        inviteStatus: user.inviteStatus,
      },
      pg,
    });
  } catch (error) {
    console.error('Accept Invite Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get all staff editors for this PG
// @route   GET /api/staff
// @access  Private (Owner ONLY)
exports.getStaff = async (req, res) => {
  try {
    const staff = await User.find({
      pgId: req.user.pgId,
      role: 'editor',
    }).select('-password').sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: staff.length,
      staff,
    });
  } catch (error) {
    console.error('Get Staff Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
