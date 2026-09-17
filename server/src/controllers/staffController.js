const User = require('../models/User');
const PG = require('../models/PG');

// @desc    Invite / Add Editor (Staff Management with branch assignment & permissions)
// @route   POST /api/staff/invite
// @access  Private (Owner ONLY)
exports.inviteEditor = async (req, res) => {
  try {
    const { name, email, password, phone, pgId, permissions } = req.body;
    const ownerId = req.user._id;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and temporary password are required',
      });
    }

    // Determine target branch: if owner selected a branch from myPGs, verify ownership
    let targetPgId = req.user.pgId;
    if (pgId) {
      const verifiedPg = await PG.findOne({ _id: pgId, ownerId });
      if (verifiedPg) {
        targetPgId = verifiedPg._id;
      }
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    const defaultPermissions = {
      manageRooms: true,
      manageMaintenance: true,
      manageTenants: true,
      manageComplaints: true,
      manageNotices: true,
      ...(permissions || {}),
    };

    const editor = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'editor',
      pgId: targetPgId,
      phone: phone ? phone.trim() : '',
      invitedBy: ownerId,
      inviteStatus: 'pending', // Must accept invite on first login
      permissions: defaultPermissions,
    });

    await editor.save();

    const populatedEditor = await User.findById(editor._id)
      .populate('pgId', 'name pgType address')
      .select('-password');

    return res.status(201).json({
      success: true,
      message: `Staff Editor invite created for ${editor.name}. They will be prompted to accept the invite on login.`,
      editor: populatedEditor,
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
        permissions: user.permissions,
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

// @desc    Get all staff editors for owner's PGs (optionally filtered by pgId)
// @route   GET /api/staff
// @access  Private (Owner ONLY)
exports.getStaff = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const { pgId } = req.query;

    // Find all PGs owned by this owner
    const ownedPGs = await PG.find({ ownerId }).select('_id');
    const ownedPgIds = ownedPGs.map((p) => p._id.toString());

    let query = {
      $or: [
        { pgId: { $in: ownedPgIds } },
        { invitedBy: ownerId },
      ],
      role: 'editor',
    };

    if (pgId && pgId !== 'ALL') {
      query = {
        pgId: pgId,
        role: 'editor',
      };
    }

    const staff = await User.find(query)
      .populate('pgId', 'name pgType address')
      .select('-password')
      .sort({ createdAt: -1 });

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

// @desc    Update Staff Permissions or reassign branch (Owner ONLY)
// @route   PUT /api/staff/:id/permissions
// @access  Private (Owner ONLY)
exports.updateStaffPermissions = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const { permissions, pgId } = req.body;

    const editor = await User.findOne({
      _id: req.params.id,
      role: 'editor',
    });

    if (!editor) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found',
      });
    }

    // Verify owner authorization
    const isInviter = editor.invitedBy && editor.invitedBy.toString() === ownerId.toString();
    const currentPG = await PG.findById(editor.pgId);
    const isPgOwner = currentPG && currentPG.ownerId.toString() === ownerId.toString();

    if (!isInviter && !isPgOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this staff member',
      });
    }

    if (permissions && typeof permissions === 'object') {
      editor.permissions = {
        manageRooms: true,
        manageMaintenance: true,
        manageTenants: true,
        manageComplaints: true,
        manageNotices: true,
        ...(editor.permissions?.toObject ? editor.permissions.toObject() : editor.permissions || {}),
        ...permissions,
      };
      editor.markModified('permissions');
    }

    let branchChanged = false;
    if (pgId) {
      const verifiedPg = await PG.findOne({ _id: pgId, ownerId });
      if (verifiedPg && verifiedPg._id.toString() !== editor.pgId?.toString()) {
        editor.pgId = verifiedPg._id;
        branchChanged = true;
      }
    }

    await editor.save();

    const updatedEditor = await User.findById(editor._id)
      .populate('pgId', 'name pgType address')
      .select('-password');

    // Real-time socket emission to the target staff member
    const emitToUser = req.app.get('emitToUser');
    if (emitToUser) {
      if (branchChanged && updatedEditor.pgId) {
        emitToUser(editor._id, 'STAFF_BRANCH_TRANSFERRED', {
          pg: updatedEditor.pgId,
          message: `You have been shifted to branch "${updatedEditor.pgId.name}" by the PG Owner.`,
          transferredBy: req.user.name,
        });
      }
      if (permissions) {
        emitToUser(editor._id, 'STAFF_PERMISSIONS_UPDATED', {
          permissions: updatedEditor.permissions,
          message: `Your operational permissions were updated by the PG Owner.`,
          updatedBy: req.user.name,
        });
      }
    }

    return res.json({
      success: true,
      message: branchChanged
        ? `Shifted ${editor.name} to ${updatedEditor.pgId?.name || 'new branch'} successfully!`
        : `Permissions updated for ${editor.name}`,
      editor: updatedEditor,
    });
  } catch (error) {
    console.error('Update Staff Permissions Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating staff permissions',
    });
  }
};

// @desc    Delete / Remove Staff member (Owner ONLY)
// @route   DELETE /api/staff/:id
// @access  Private (Owner ONLY)
exports.deleteStaff = async (req, res) => {
  try {
    const ownerId = req.user._id;

    const editor = await User.findOne({
      _id: req.params.id,
      role: 'editor',
    });

    if (!editor) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found',
      });
    }

    const isInviter = editor.invitedBy && editor.invitedBy.toString() === ownerId.toString();
    const currentPG = await PG.findById(editor.pgId);
    const isPgOwner = currentPG && currentPG.ownerId.toString() === ownerId.toString();

    if (!isInviter && !isPgOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove this staff member',
      });
    }

    await User.findByIdAndDelete(editor._id);

    return res.json({
      success: true,
      message: `Staff member ${editor.name} has been removed successfully`,
    });
  } catch (error) {
    console.error('Delete Staff Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error removing staff member',
    });
  }
};
