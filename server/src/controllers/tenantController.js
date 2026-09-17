const User = require('../models/User');
const PG = require('../models/PG');
const Complaint = require('../models/Complaint');

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

    const cleanRoom = roomNumber.trim().toUpperCase();

    // Check capacity and maintenance status if room is configured
    const pg = await PG.findById(pgId);
    if (pg && pg.rooms && pg.rooms.length > 0) {
      const roomConfig = pg.rooms.find(r => r.roomNumber.toUpperCase() === cleanRoom);
      if (roomConfig) {
        if (roomConfig.status === 'maintenance') {
          return res.status(400).json({
            success: false,
            message: `Room ${roomConfig.roomNumber} is currently under maintenance (${roomConfig.maintenanceReason || 'Cleaning / Repair in progress'}). Please choose another room.`,
          });
        }
        const currentCount = await User.countDocuments({
          pgId,
          role: 'tenant',
          inviteStatus: 'accepted',
          roomNumber: roomConfig.roomNumber,
        });
        if (currentCount >= roomConfig.capacity) {
          return res.status(400).json({
            success: false,
            message: `Room ${roomConfig.roomNumber} is full (${currentCount}/${roomConfig.capacity} beds occupied)`,
          });
        }
      }
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    const tenantGender = (gender && ['male', 'female', 'other'].includes(gender.toLowerCase()))
      ? gender.toLowerCase()
      : (pg && pg.pgType === 'girls' ? 'female' : 'male');

    const tenant = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'tenant',
      gender: tenantGender,
      roomNumber: cleanRoom,
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

// @desc    Get all tenants in this PG (accepted, pending approval requests & vacated history)
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
        { lastRoomNumber: { $regex: search, $options: 'i' } },
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

    // Vacated / Checked out students archive
    const vacatedTenants = await User.find({ ...baseQuery, inviteStatus: 'vacated' })
      .select('-password')
      .sort({ vacatedAt: -1 });

    return res.json({
      success: true,
      count: tenants.length,
      tenants,
      pendingTenants,
      pendingCount: pendingTenants.length,
      vacatedTenants,
      vacatedCount: vacatedTenants.length,
    });
  } catch (error) {
    console.error('Get Tenants Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Approve a pending student enrollment request with room allocation
// @route   PUT /api/tenants/:id/approve
// @access  Private (Owner, Accepted Editor)
exports.approveTenant = async (req, res) => {
  try {
    const pgId = req.user.pgId;
    const { roomNumber } = req.body;

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

    const assignedRoom = roomNumber && roomNumber.trim()
      ? roomNumber.trim().toUpperCase()
      : (tenant.roomNumber && tenant.roomNumber !== 'Unassigned' ? tenant.roomNumber.toUpperCase() : null);

    if (!assignedRoom || assignedRoom === 'UNASSIGNED') {
      return res.status(400).json({
        success: false,
        message: 'Please allocate an available room to the student before approving',
      });
    }

    // Check capacity & maintenance if PG has configured rooms
    const pg = await PG.findById(pgId);
    if (pg && pg.rooms && pg.rooms.length > 0) {
      const roomConfig = pg.rooms.find(r => r.roomNumber.toUpperCase() === assignedRoom);
      if (roomConfig) {
        if (roomConfig.status === 'maintenance') {
          return res.status(400).json({
            success: false,
            message: `Room ${roomConfig.roomNumber} is currently under maintenance / cleaning (${roomConfig.maintenanceReason || 'Work in progress'}). Cannot allocate this room.`,
          });
        }
        const currentResidentsCount = await User.countDocuments({
          pgId,
          role: 'tenant',
          inviteStatus: 'accepted',
          roomNumber: roomConfig.roomNumber,
          _id: { $ne: tenant._id },
        });

        if (currentResidentsCount >= roomConfig.capacity) {
          return res.status(400).json({
            success: false,
            message: `Room ${roomConfig.roomNumber} is full! Capacity is ${roomConfig.capacity}, currently occupied by ${currentResidentsCount} students.`,
          });
        }
      }
    }

    tenant.roomNumber = assignedRoom;
    tenant.inviteStatus = 'accepted';
    await tenant.save();

    // Sync any existing complaints registered by this student to their approved room
    await Complaint.updateMany(
      { tenantId: tenant._id },
      { $set: { roomNumber: assignedRoom } }
    );

    return res.json({
      success: true,
      message: `Approved ${tenant.name} and allocated to Room ${tenant.roomNumber}`,
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

// @desc    Change room allocation for an enrolled student
// @route   PUT /api/tenants/:id/room
// @access  Private (Owner, Accepted Editor)
exports.changeTenantRoom = async (req, res) => {
  try {
    const pgId = req.user.pgId;
    const { roomNumber } = req.body;

    if (!roomNumber || !roomNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid room number',
      });
    }

    const cleanRoom = roomNumber.trim().toUpperCase();

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

    if (tenant.roomNumber && tenant.roomNumber.toUpperCase() === cleanRoom) {
      return res.json({
        success: true,
        message: `${tenant.name} is already assigned to Room ${cleanRoom}`,
        tenant,
      });
    }

    // Check capacity if target room is configured in pg.rooms
    const pg = await PG.findById(pgId);
    if (pg && pg.rooms && pg.rooms.length > 0) {
      const targetRoomConfig = pg.rooms.find(
        (r) => r.roomNumber.toUpperCase() === cleanRoom
      );

      if (targetRoomConfig) {
        if (targetRoomConfig.status === 'maintenance') {
          return res.status(400).json({
            success: false,
            message: `Room ${targetRoomConfig.roomNumber} is currently under maintenance / cleaning (${targetRoomConfig.maintenanceReason || 'Work in progress'}). Cannot move student here.`,
          });
        }
        const currentCount = await User.countDocuments({
          pgId,
          role: 'tenant',
          inviteStatus: 'accepted',
          roomNumber: targetRoomConfig.roomNumber,
          _id: { $ne: tenant._id },
        });

        if (currentCount >= targetRoomConfig.capacity) {
          return res.status(400).json({
            success: false,
            message: `Room ${targetRoomConfig.roomNumber} is full (${currentCount}/${targetRoomConfig.capacity} beds occupied). Please choose another room.`,
          });
        }
      }
    }

    const previousRoom = tenant.roomNumber || 'None';
    tenant.roomNumber = cleanRoom;
    await tenant.save();

    // Sync complaints registered by this student to their new room
    await Complaint.updateMany(
      { tenantId: tenant._id },
      { $set: { roomNumber: cleanRoom } }
    );

    return res.json({
      success: true,
      message: `Room changed successfully for ${tenant.name} from Room ${previousRoom} to Room ${cleanRoom}!`,
      tenant: {
        id: tenant._id,
        name: tenant.name,
        email: tenant.email,
        roomNumber: tenant.roomNumber,
        gender: tenant.gender,
        phone: tenant.phone,
        inviteStatus: tenant.inviteStatus,
      },
    });
  } catch (error) {
    console.error('Change Tenant Room Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating student room',
    });
  }
};


// @desc    Transfer a tenant between PG branches owned by the same owner
// @route   PUT /api/tenants/:id/transfer
// @access  Private (Owner ONLY)
exports.transferTenantBranch = async (req, res) => {
  try {
    const tenantId = req.params.id;
    const { targetPgId } = req.body;

    if (!targetPgId) {
      return res.status(400).json({
        success: false,
        message: 'Please select a destination PG branch',
      });
    }

    const tenant = await User.findById(tenantId);
    if (!tenant || tenant.role !== 'tenant') {
      return res.status(404).json({
        success: false,
        message: 'Student record not found',
      });
    }

    const currentPg = await PG.findById(tenant.pgId);
    const targetPg = await PG.findById(targetPgId);

    if (!targetPg) {
      return res.status(404).json({
        success: false,
        message: 'Target PG branch not found',
      });
    }

    // Verify owner owns both PGs
    if (targetPg.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to transfer students to this branch',
      });
    }

    if (currentPg && currentPg.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not own the branch this student currently belongs to',
      });
    }

    // Gender vs PG Type Safety Verification
    const cleanGender = (tenant.gender || 'male').toLowerCase();
    const targetType = (targetPg.pgType || 'boys').toLowerCase();

    if (targetType === 'girls' && cleanGender === 'male') {
      return res.status(400).json({
        success: false,
        message: `Cannot transfer male student "${tenant.name}" to Girls PG "${targetPg.name}".`,
      });
    }

    if (targetType === 'boys' && cleanGender === 'female') {
      return res.status(400).json({
        success: false,
        message: `Cannot transfer female student "${tenant.name}" to Boys PG "${targetPg.name}".`,
      });
    }

    // Move tenant
    tenant.pgId = targetPg._id;
    await tenant.save();

    // Migrate all student's complaints to the destination PG
    const Complaint = require('../models/Complaint');
    await Complaint.updateMany(
      { tenantId: tenant._id },
      { $set: { pgId: targetPg._id } }
    );

    return res.json({
      success: true,
      message: `Successfully transferred ${tenant.name} to "${targetPg.name}".`,
      tenant: {
        id: tenant._id,
        name: tenant.name,
        email: tenant.email,
        roomNumber: tenant.roomNumber,
        pgId: tenant.pgId,
        gender: tenant.gender,
      },
    });
  } catch (error) {
    console.error('Transfer Tenant Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error transferring student',
    });
  }
};

// @desc    Checkout / Vacate student from PG (resets room, revokes active access, archives record)
// @route   PUT /api/tenants/:id/vacate
// @access  Private (Owner, Accepted Editor)
exports.vacateTenant = async (req, res) => {
  try {
    const pgId = req.user.pgId;
    const { reason, markMaintenance, maintenanceReason } = req.body;

    const tenant = await User.findOne({
      _id: req.params.id,
      pgId,
      role: 'tenant',
      inviteStatus: 'accepted',
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Active student record not found in your PG',
      });
    }

    const previousRoom = tenant.roomNumber;
    tenant.inviteStatus = 'vacated';
    tenant.lastRoomNumber = previousRoom || 'None';
    tenant.roomNumber = '';
    tenant.vacatedAt = new Date();
    tenant.vacatedReason = reason ? reason.trim() : 'Stay completed / Checked out';

    await tenant.save();

    // If requested, put the student's room into maintenance
    let roomStatusMsg = '';
    if (markMaintenance && previousRoom && previousRoom !== 'None') {
      const pg = await PG.findById(pgId);
      if (pg && pg.rooms) {
        const room = pg.rooms.find(r => r.roomNumber.toUpperCase() === previousRoom.toUpperCase());
        if (room) {
          room.status = 'maintenance';
          room.maintenanceReason = maintenanceReason ? maintenanceReason.trim() : 'Cleaning after student checkout';
          await pg.save();
          roomStatusMsg = ` and Room ${room.roomNumber} marked under maintenance / cleaning.`;
        }
      }
    }

    return res.json({
      success: true,
      message: `Student ${tenant.name} has been checked out successfully${roomStatusMsg}`,
      tenant: {
        id: tenant._id,
        name: tenant.name,
        email: tenant.email,
        lastRoomNumber: tenant.lastRoomNumber,
        vacatedAt: tenant.vacatedAt,
        vacatedReason: tenant.vacatedReason,
        inviteStatus: tenant.inviteStatus,
      },
    });
  } catch (error) {
    console.error('Vacate Tenant Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error checking out student',
    });
  }
};


