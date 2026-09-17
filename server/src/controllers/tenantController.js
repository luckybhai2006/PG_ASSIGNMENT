const User = require('../models/User');

// @desc    Add Tenant to PG
// @route   POST /api/tenants
// @access  Private (Owner, Accepted Editor)
exports.addTenant = async (req, res) => {
  try {
    const { name, email, password, roomNumber, phone } = req.body;
    const pgId = req.user.pgId;

    if (!name || !email || !password || !roomNumber) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and room number are required',
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    const tenant = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'tenant',
      roomNumber: roomNumber.trim(),
      phone: phone ? phone.trim() : '',
      pgId,
      invitedBy: req.user._id,
      inviteStatus: 'accepted',
    });

    await tenant.save();

    return res.status(201).json({
      success: true,
      message: `Tenant ${tenant.name} assigned to Room ${tenant.roomNumber} successfully`,
      tenant: {
        id: tenant._id,
        name: tenant.name,
        email: tenant.email,
        roomNumber: tenant.roomNumber,
        phone: tenant.phone,
        role: tenant.role,
        createdAt: tenant.createdAt,
      },
    });
  } catch (error) {
    console.error('Add Tenant Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get all tenants in this PG (accepted & pending approval requests)
// @route   GET /api/tenants
// @access  Private (Owner, Accepted Editor)
exports.getTenants = async (req, res) => {
  try {
    const pgId = req.user.pgId;
    const { search } = req.query;

    const baseQuery = {
      pgId,
      role: 'tenant',
    };

    if (search) {
      baseQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { roomNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Active accepted tenants
    const tenants = await User.find({ ...baseQuery, inviteStatus: 'accepted' })
      .select('-password')
      .sort({ roomNumber: 1 });

    // Pending student approval requests
    const pendingTenants = await User.find({ pgId, role: 'tenant', inviteStatus: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: tenants.length,
      tenants,
      pendingTenants,
      pendingCount: pendingTenants.length,
    });
  } catch (error) {
    console.error('Get Tenants Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Approve a pending student enrollment request
// @route   PUT /api/tenants/:id/approve
// @access  Private (Owner, Accepted Editor)
exports.approveTenant = async (req, res) => {
  try {
    const pgId = req.user.pgId;
    const tenant = await User.findOne({
      _id: req.params.id,
      pgId,
      role: 'tenant',
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found in your PG',
      });
    }

    tenant.inviteStatus = 'accepted';
    await tenant.save();

    return res.json({
      success: true,
      message: `Approved ${tenant.name} (Room ${tenant.roomNumber})`,
      tenant: {
        id: tenant._id,
        name: tenant.name,
        email: tenant.email,
        roomNumber: tenant.roomNumber,
        phone: tenant.phone,
        inviteStatus: tenant.inviteStatus,
      },
    });
  } catch (error) {
    console.error('Approve Tenant Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error approving student',
    });
  }
};

// @desc    Reject a pending student enrollment request
// @route   PUT /api/tenants/:id/reject
// @access  Private (Owner, Accepted Editor)
exports.rejectTenant = async (req, res) => {
  try {
    const pgId = req.user.pgId;
    const tenant = await User.findOne({
      _id: req.params.id,
      pgId,
      role: 'tenant',
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found in your PG',
      });
    }

    tenant.inviteStatus = 'rejected';
    await tenant.save();

    return res.json({
      success: true,
      message: `Enrollment request for ${tenant.name} has been rejected`,
    });
  } catch (error) {
    console.error('Reject Tenant Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error rejecting student',
    });
  }
};
