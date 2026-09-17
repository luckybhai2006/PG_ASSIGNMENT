const Complaint = require('../models/Complaint');
const User = require('../models/User');

// @desc    Create a new complaint
// @route   POST /api/complaints
// @access  Private (Tenant, or Owner/Editor on behalf of tenant)
exports.createComplaint = async (req, res) => {
  try {
    const { title, description, category, priority, tenantId, roomNumber } = req.body;
    const pgId = req.user.pgId;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and category are required',
      });
    }

    let actualTenantId = req.user._id;
    let actualRoomNumber = req.user.roomNumber || 'N/A';
    let registeredByType = 'tenant';

    // If Owner or Editor is creating complaint on behalf of a tenant:
    if (req.user.role === 'owner' || req.user.role === 'editor') {
      registeredByType = 'staff';
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Staff must select a tenant to register complaint on their behalf',
        });
      }

      const tenant = await User.findById(tenantId);
      if (!tenant || tenant.pgId.toString() !== pgId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid tenant selected',
        });
      }

      actualTenantId = tenant._id;
      actualRoomNumber = roomNumber || tenant.roomNumber || 'N/A';
    } else {
      // If tenant, always use tenant's latest allocated roomNumber
      const currentUser = await User.findById(req.user._id);
      if (currentUser && currentUser.roomNumber && currentUser.roomNumber !== 'Unassigned') {
        actualRoomNumber = currentUser.roomNumber;
      } else if (roomNumber) {
        actualRoomNumber = roomNumber;
      }
    }

    const complaint = new Complaint({
      title: title.trim(),
      description: description.trim(),
      category,
      priority: priority || 'Medium',
      status: 'Pending',
      pgId,
      tenantId: actualTenantId,
      roomNumber: actualRoomNumber,
      registeredBy: req.user._id,
      registeredByType,
      timeline: [
        {
          status: 'Pending',
          note: registeredByType === 'staff'
            ? `Registered by ${req.user.role} (${req.user.name}) on behalf of tenant`
            : 'Complaint submitted by tenant',
          changedBy: req.user._id,
          changedByName: req.user.name,
          timestamp: new Date(),
        },
      ],
    });

    await complaint.save();

    const populated = await Complaint.findById(complaint._id)
      .populate('tenantId', 'name email roomNumber phone')
      .populate('registeredBy', 'name role');

    // Real-time emission to PG branch members
    const emitToPG = req.app.get('emitToPG');
    if (emitToPG) {
      emitToPG(pgId, 'NEW_COMPLAINT', {
        complaint: populated,
        message: `New ${populated.priority} ticket: ${populated.title} (Room ${populated.roomNumber})`,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Complaint registered successfully',
      complaint: populated,
    });
  } catch (error) {
    console.error('Create Complaint Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get complaints
// @route   GET /api/complaints
// @access  Private (Owner & Editor get all in PG; Tenant gets only their own)
exports.getComplaints = async (req, res) => {
  try {
    const pgId = req.user.pgId;
    const { status, category, priority, search } = req.query;

    const query = { pgId };

    // Tenant sees only their complaints
    if (req.user.role === 'tenant') {
      query.tenantId = req.user._id;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { roomNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const complaints = await Complaint.find(query)
      .populate('tenantId', 'name email roomNumber phone')
      .populate('registeredBy', 'name role')
      .sort({ createdAt: -1 });

    const sanitizedComplaints = complaints.map((c) => {
      const doc = c.toObject();
      if (doc.tenantId && doc.tenantId.roomNumber && doc.tenantId.roomNumber !== 'Unassigned') {
        doc.roomNumber = doc.tenantId.roomNumber;
      }
      return doc;
    });

    return res.json({
      success: true,
      count: sanitizedComplaints.length,
      complaints: sanitizedComplaints,
    });
  } catch (error) {
    console.error('Get Complaints Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get single complaint details
// @route   GET /api/complaints/:id
// @access  Private
exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('tenantId', 'name email roomNumber phone')
      .populate('registeredBy', 'name role');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    // Tenant can only see their own complaint
    if (
      req.user.role === 'tenant' &&
      complaint.tenantId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this complaint',
      });
    }

    const doc = complaint.toObject();
    if (doc.tenantId && doc.tenantId.roomNumber && doc.tenantId.roomNumber !== 'Unassigned') {
      doc.roomNumber = doc.tenantId.roomNumber;
    }

    return res.json({
      success: true,
      complaint: doc,
    });
  } catch (error) {
    console.error('Get Complaint By Id Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update complaint resolution status & notes
// @route   PATCH /api/complaints/:id/status
// @access  Private (Owner, Accepted Editor ONLY)
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { status, resolutionNotes } = req.body;
    const complaintId = req.params.id;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    // Verify same PG
    if (complaint.pgId.toString() !== req.user.pgId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized for this PG complaint',
      });
    }

    const previousStatus = complaint.status;
    complaint.status = status;

    if (resolutionNotes) {
      complaint.resolutionNotes = resolutionNotes.trim();
    }

    if (status === 'Resolved' && !complaint.resolvedAt) {
      complaint.resolvedAt = new Date();
    } else if (status !== 'Resolved') {
      complaint.resolvedAt = null;
    }

    // Append to timeline
    complaint.timeline.push({
      status,
      note: resolutionNotes || `Status updated from ${previousStatus} to ${status} by ${req.user.name} (${req.user.role})`,
      changedBy: req.user._id,
      changedByName: req.user.name,
      timestamp: new Date(),
    });

    await complaint.save();

    const populated = await Complaint.findById(complaint._id)
      .populate('tenantId', 'name email roomNumber phone')
      .populate('registeredBy', 'name role');

    // Real-time emission
    const emitToPG = req.app.get('emitToPG');
    const emitToUser = req.app.get('emitToUser');
    if (emitToPG) {
      emitToPG(complaint.pgId, 'COMPLAINT_STATUS_UPDATED', {
        complaint: populated,
        message: `Ticket #${complaint._id.toString().slice(-5).toUpperCase()} marked as ${status}`,
      });
    }
    if (emitToUser && complaint.tenantId) {
      emitToUser(complaint.tenantId, 'MY_COMPLAINT_STATUS_UPDATED', {
        complaint: populated,
        message: `Your complaint "${complaint.title}" is now ${status}`,
      });
    }

    return res.json({
      success: true,
      message: `Complaint status successfully marked as ${status}`,
      complaint: populated,
    });
  } catch (error) {
    console.error('Update Complaint Status Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get dashboard metrics / stats
// @route   GET /api/complaints/stats
// @access  Private
exports.getStats = async (req, res) => {
  try {
    const pgId = req.user.pgId;
    const filter = { pgId };

    if (req.user.role === 'tenant') {
      filter.tenantId = req.user._id;
    }

    const total = await Complaint.countDocuments(filter);
    const pending = await Complaint.countDocuments({ ...filter, status: 'Pending' });
    const inProgress = await Complaint.countDocuments({ ...filter, status: 'In Progress' });
    const resolved = await Complaint.countDocuments({ ...filter, status: 'Resolved' });
    const urgent = await Complaint.countDocuments({
      ...filter,
      priority: 'Urgent',
      status: { $ne: 'Resolved' },
    });

    const totalTenants = await User.countDocuments({ pgId, role: 'tenant', inviteStatus: 'accepted' });
    const pendingStudents = await User.countDocuments({ pgId, role: 'tenant', inviteStatus: 'pending' });

    return res.json({
      success: true,
      stats: {
        total,
        pending,
        inProgress,
        resolved,
        urgent,
        totalTenants,
        pendingStudents,
      },
    });
  } catch (error) {
    console.error('Get Stats Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
