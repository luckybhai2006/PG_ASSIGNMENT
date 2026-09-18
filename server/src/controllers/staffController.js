const User = require('../models/User');
const PG = require('../models/PG');
const Staff = require('../models/Staff');

// @desc    Invite / Add Staff / Manager (Staff Management with branch assignment, role & permissions)
// @route   POST /api/staff/invite
// @access  Private (Owner ONLY)
exports.inviteEditor = async (req, res) => {
  try {
    const { name, email, password, phone, pgId, permissions, staffRole = 'staff', designation = '' } = req.body;
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

    const isManager = staffRole === 'manager';
    const defaultPermissions = {
      manageRooms: true,
      manageMaintenance: true,
      manageTenants: true,
      manageComplaints: true,
      manageNotices: true,
      canChat: true,
      canAssignTasks: isManager,
      ...(permissions || {}),
    };

    const finalDesignation = designation.trim() || (isManager ? 'Property Manager' : 'Staff Member');

    const editor = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: isManager ? 'manager' : 'editor',
      staffRole: isManager ? 'manager' : 'staff',
      designation: finalDesignation,
      pgId: targetPgId,
      phone: phone ? phone.trim() : '',
      invitedBy: ownerId,
      inviteStatus: 'pending', // Must accept invite on first login
      permissions: defaultPermissions,
    });

    await editor.save();

    // Create record in dedicated Staff MongoDB collection
    await Staff.findOneAndUpdate(
      { userId: editor._id },
      {
        userId: editor._id,
        pgId: targetPgId,
        name: editor.name,
        email: editor.email,
        phone: editor.phone,
        staffRole: editor.staffRole,
        designation: finalDesignation,
        invitedBy: ownerId,
        status: 'pending',
      },
      { upsert: true, new: true }
    );

    const populatedEditor = await User.findById(editor._id)
      .populate('pgId', 'name pgType address')
      .select('-password');

    return res.status(201).json({
      success: true,
      message: `${isManager ? 'Manager' : 'Staff'} invite created for ${editor.name}. They will be prompted to accept the invite on login.`,
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

// @desc    Get staff editors (Owner across branches, Editor within their facility)
// @route   GET /api/staff
// @access  Private (Owner & Editor)
exports.getStaff = async (req, res) => {
  try {
    const user = req.user;
    const { pgId } = req.query;

    const roleCondition = { $in: ['editor', 'manager', 'staff'] };
    let query = { role: roleCondition };

    if (user.role === 'owner') {
      const ownedPGs = await PG.find({ ownerId: user._id }).select('_id');
      const ownedPgIds = ownedPGs.map((p) => p._id);

      if (pgId && pgId !== 'ALL') {
        query = {
          role: roleCondition,
          $or: [
            { pgId: pgId },
            { invitedBy: user._id, pgId: pgId },
          ],
        };
      } else {
        query = {
          role: roleCondition,
          $or: [
            { pgId: { $in: ownedPgIds } },
            { invitedBy: user._id },
          ],
        };
      }
    } else {
      // Editor / Manager: load colleagues in same PG branch
      const activePgId = pgId || user.pgId;
      if (activePgId) {
        query = {
          role: roleCondition,
          pgId: activePgId,
        };
      } else {
        query = { role: roleCondition };
      }
    }

    const staff = await User.find(query)
      .populate('pgId', 'name pgType address')
      .select('-password')
      .sort({ createdAt: -1 });

    // Respond immediately for blazing fast single-digit ms response time
    res.json({
      success: true,
      count: staff.length,
      staff,
    });

    // Non-blocking background sync with bulkWrite
    setImmediate(async () => {
      try {
        const bulkOps = staff.map((s) => ({
          updateOne: {
            filter: { userId: s._id },
            update: {
              $set: {
                userId: s._id,
                pgId: s.pgId?._id || s.pgId,
                name: s.name,
                email: s.email,
                phone: s.phone || '',
                staffRole: s.staffRole || (s.permissions?.canAssignTasks ? 'manager' : 'staff'),
                designation: s.designation || (s.permissions?.canAssignTasks ? 'Property Manager' : 'Staff Member'),
                invitedBy: s.invitedBy || user._id,
                status: s.inviteStatus === 'accepted' ? 'active' : 'pending',
              },
            },
            upsert: true,
          },
        }));
        if (bulkOps.length > 0) {
          await Staff.bulkWrite(bulkOps, { ordered: false });
        }
      } catch (_) {}
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
    const { permissions, pgId, staffRole, designation } = req.body;

    const editor = await User.findOne({
      _id: req.params.id,
      role: { $in: ['editor', 'manager', 'staff'] },
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

    if (staffRole) {
      editor.staffRole = staffRole;
      editor.role = staffRole === 'manager' ? 'manager' : 'editor';
    }
    if (designation !== undefined) {
      editor.designation = designation.trim();
    }

    if (permissions && typeof permissions === 'object') {
      editor.permissions = {
        manageRooms: true,
        manageMaintenance: true,
        manageTenants: true,
        manageComplaints: true,
        manageNotices: true,
        canChat: true,
        canAssignTasks: editor.staffRole === 'manager',
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

    // Sync Staff collection
    await Staff.findOneAndUpdate(
      { userId: editor._id },
      {
        userId: editor._id,
        pgId: editor.pgId,
        name: editor.name,
        email: editor.email,
        phone: editor.phone || '',
        staffRole: editor.staffRole || (editor.permissions?.canAssignTasks ? 'manager' : 'staff'),
        designation: editor.designation || (editor.permissions?.canAssignTasks ? 'Property Manager' : 'Staff Member'),
        invitedBy: editor.invitedBy || ownerId,
        status: editor.inviteStatus === 'accepted' ? 'active' : 'pending',
      },
      { upsert: true }
    ).catch(() => {});

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
      role: { $in: ['editor', 'manager', 'staff'] },
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
    await Staff.deleteOne({ userId: editor._id }).catch(() => {});

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
