const PG = require('../models/PG');
const User = require('../models/User');

// @desc    Get PG Account Details (rules, notice board, contact info)
// @route   GET /api/pg
// @access  Private (Owner, Accepted Editor, Tenant)
exports.getPGDetails = async (req, res) => {
  try {
    const pgId = req.user.pgId;
    if (!pgId) {
      return res.status(404).json({
        success: false,
        message: 'No PG account linked to this user',
      });
    }

    const pg = await PG.findById(pgId).populate('ownerId', 'name email phone');
    if (!pg) {
      return res.status(404).json({
        success: false,
        message: 'PG details not found',
      });
    }

    if (!pg.joinCode) {
      pg.joinCode = 'GH-2024';
      await pg.save();
    }

    const tenantCount = await User.countDocuments({ pgId, role: 'tenant' });
    const pgData = pg.toObject();
    pgData.tenantCount = tenantCount;

    return res.json({
      success: true,
      pg: pgData,
    });
  } catch (error) {
    console.error('Get PG Details Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update PG Account Profile
// @route   PUT /api/pg/profile
// @access  Private (Owner ONLY)
exports.updatePGProfile = async (req, res) => {
  try {
    const { name, address, contactPhone, rules, joinCode } = req.body;
    const pgId = req.user.pgId;

    const pg = await PG.findById(pgId);
    if (!pg) {
      return res.status(404).json({
        success: false,
        message: 'PG not found',
      });
    }

    // Double check that current user is the owner of this PG
    if (pg.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the PG Owner can update the account profile',
      });
    }

    if (name) pg.name = name.trim();
    if (address) pg.address = address.trim();
    if (contactPhone !== undefined) pg.contactPhone = contactPhone.trim();
    if (rules && Array.isArray(rules)) pg.rules = rules;
    if (joinCode && joinCode.trim()) pg.joinCode = joinCode.trim().toUpperCase();

    await pg.save();

    const tenantCount = await User.countDocuments({ pgId, role: 'tenant' });
    const pgData = pg.toObject();
    pgData.tenantCount = tenantCount;

    return res.json({
      success: true,
      message: 'PG profile updated successfully',
      pg: pgData,
    });
  } catch (error) {
    console.error('Update PG Profile Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Regenerate Secret Student Join Code
// @route   POST /api/pg/regenerate-join-code
// @access  Private (Owner ONLY)
exports.regenerateJoinCode = async (req, res) => {
  try {
    const pgId = req.user.pgId;
    const pg = await PG.findById(pgId);
    if (!pg) {
      return res.status(404).json({
        success: false,
        message: 'PG not found',
      });
    }

    if (pg.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the PG Owner can regenerate the join passcode',
      });
    }

    const prefix = (pg.name || 'PG')
      .replace(/[^A-Za-z]/g, '')
      .slice(0, 2)
      .toUpperCase() || 'PG';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newCode = `${prefix}-${randomSuffix}`;

    pg.joinCode = newCode;
    await pg.save();

    const tenantCount = await User.countDocuments({ pgId, role: 'tenant' });
    const pgData = pg.toObject();
    pgData.tenantCount = tenantCount;

    return res.json({
      success: true,
      message: `Passcode regenerated successfully: ${newCode}`,
      joinCode: newCode,
      pg: pgData,
    });
  } catch (error) {
    console.error('Regenerate Join Code Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Add announcement / notice to Notice Board
// @route   POST /api/pg/notices
// @access  Private (Owner, Accepted Editor)
exports.addNotice = async (req, res) => {
  try {
    const { title, message, priority } = req.body;
    const pgId = req.user.pgId;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Notice title and message are required',
      });
    }

    const pg = await PG.findById(pgId);
    if (!pg) {
      return res.status(404).json({
        success: false,
        message: 'PG not found',
      });
    }

    pg.noticeBoard.unshift({
      title: title.trim(),
      message: message.trim(),
      priority: priority || 'normal',
      postedBy: req.user._id,
      date: new Date(),
    });

    await pg.save();

    return res.status(201).json({
      success: true,
      message: 'Notice posted successfully',
      noticeBoard: pg.noticeBoard,
    });
  } catch (error) {
    console.error('Add Notice Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Delete announcement from Notice Board
// @route   DELETE /api/pg/notices/:noticeId
// @access  Private (Owner, Accepted Editor)
exports.deleteNotice = async (req, res) => {
  try {
    const { noticeId } = req.params;
    const pg = await PG.findById(req.user.pgId);

    if (!pg) {
      return res.status(404).json({
        success: false,
        message: 'PG not found',
      });
    }

    pg.noticeBoard = pg.noticeBoard.filter(
      (notice) => notice._id.toString() !== noticeId
    );
    await pg.save();

    return res.json({
      success: true,
      message: 'Notice removed successfully',
      noticeBoard: pg.noticeBoard,
    });
  } catch (error) {
    console.error('Delete Notice Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
