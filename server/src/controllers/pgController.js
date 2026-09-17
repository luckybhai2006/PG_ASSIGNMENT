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
    const { name, address, contactPhone, rules, joinCode, pgType, curfewTime, wardenPhone } = req.body;
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
    if (pgType && ['boys', 'girls', 'co-ed'].includes(pgType)) pg.pgType = pgType;
    if (curfewTime !== undefined) pg.curfewTime = curfewTime.trim();
    if (wardenPhone !== undefined) pg.wardenPhone = wardenPhone.trim();

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

// @desc    Create an additional PG branch (Boys or Girls)
// @route   POST /api/pg/branch
// @access  Private (Owner only)
exports.createPGBranch = async (req, res) => {
  try {
    const { name, address, contactPhone, pgType = 'girls', curfewTime, wardenPhone } = req.body;

    if (!name || !address) {
      return res.status(400).json({ success: false, message: 'Branch name and address are required' });
    }

    const cleanPgType = ['boys', 'girls', 'co-ed'].includes(pgType) ? pgType : 'girls';

    const defaultRules = cleanPgType === 'girls'
      ? [
          'Main gate curfew strictly at 9:30 PM.',
          'Male visitors strictly prohibited inside residential floors.',
          'Inform warden prior to night outs with guardian authorization.',
          'Maintain quiet hours in study areas and common corridors after 11:00 PM.',
        ]
      : [
          'Main gate closes at 10:30 PM.',
          'Keep rooms and common areas clean; turn off electrical appliances when leaving.',
          'Visitors allowed only in the ground-floor lounge area until 8:00 PM.',
          'No smoking, alcohol, or substance consumption on premises.',
        ];

    const newBranch = new PG({
      name: name.trim(),
      address: address.trim(),
      ownerId: req.user._id,
      contactPhone: contactPhone ? contactPhone.trim() : (req.user.phone || ''),
      pgType: cleanPgType,
      curfewTime: curfewTime ? curfewTime.trim() : (cleanPgType === 'girls' ? '9:30 PM' : '10:30 PM'),
      wardenPhone: wardenPhone ? wardenPhone.trim() : '',
      rules: defaultRules,
      noticeBoard: [
        {
          title: `Welcome to ${name.trim()} (${cleanPgType === 'girls' ? 'Girls PG' : 'Boys PG'})`,
          message: 'Feel free to post room or amenity issues here for fast resolution.',
          priority: 'normal',
          postedBy: req.user._id,
        },
      ],
    });

    await newBranch.save();

    // Automatically switch active PG to this new branch so owner can configure it immediately
    const user = await User.findById(req.user._id);
    user.pgId = newBranch._id;
    await user.save();

    const myPGs = await PG.find({ ownerId: user._id })
      .select('name address pgType joinCode contactPhone curfewTime wardenPhone createdAt')
      .sort({ createdAt: 1 });

    const pgData = newBranch.toObject();
    pgData.tenantCount = 0;

    return res.status(201).json({
      success: true,
      message: `Branch "${newBranch.name}" (${cleanPgType === 'girls' ? 'Girls PG' : 'Boys PG'}) created successfully!`,
      pg: pgData,
      myPGs,
    });
  } catch (error) {
    console.error('Create Branch Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error creating branch' });
  }
};

// @desc    Get all branches owned by current Owner
// @route   GET /api/pg/branches
// @access  Private (Owner only)
exports.getBranches = async (req, res) => {
  try {
    const myPGs = await PG.find({ ownerId: req.user._id })
      .select('name address pgType joinCode contactPhone curfewTime wardenPhone createdAt')
      .sort({ createdAt: 1 });

    return res.json({
      success: true,
      count: myPGs.length,
      branches: myPGs,
    });
  } catch (error) {
    console.error('Get Branches Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error fetching branches' });
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

// @desc    Get all PG rooms with live occupancy details
// @route   GET /api/pg/rooms
// @access  Private (Owner, Accepted Editor)
exports.getRooms = async (req, res) => {
  try {
    const pgId = req.user.pgId;
    const pg = await PG.findById(pgId);
    if (!pg) {
      return res.status(404).json({ success: false, message: 'PG not found' });
    }

    const rooms = pg.rooms || [];

    // Fetch all active accepted tenants in this PG to compute occupancy
    const activeTenants = await User.find({
      pgId,
      role: 'tenant',
      inviteStatus: 'accepted',
    }).select('name email phone roomNumber');

    // Group tenants by normalized uppercase roomNumber
    const tenantsByRoom = {};
    activeTenants.forEach((t) => {
      const rNum = (t.roomNumber || '').trim().toUpperCase();
      if (rNum) {
        if (!tenantsByRoom[rNum]) tenantsByRoom[rNum] = [];
        tenantsByRoom[rNum].push({
          id: t._id,
          name: t.name,
          email: t.email,
          phone: t.phone,
        });
      }
    });

    const roomsWithOccupancy = rooms.map((room) => {
      const rNum = room.roomNumber.toUpperCase();
      const residents = tenantsByRoom[rNum] || [];
      const occupied = residents.length;
      const capacity = room.capacity || 2;
      const available = Math.max(0, capacity - occupied);
      const isFull = occupied >= capacity;

      return {
        _id: room._id,
        roomNumber: room.roomNumber,
        block: room.block || '',
        wing: room.wing || '',
        floor: room.floor || 1,
        capacity,
        occupied,
        available,
        isFull,
        residents,
      };
    });

    const allRooms = roomsWithOccupancy.sort((a, b) => {
      if (a.floor !== b.floor) return a.floor - b.floor;
      return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
    });

    const totalRooms = allRooms.length;
    const totalBeds = allRooms.reduce((sum, r) => sum + r.capacity, 0);
    const occupiedBeds = allRooms.reduce((sum, r) => sum + r.occupied, 0);
    const availableBeds = Math.max(0, totalBeds - occupiedBeds);

    return res.json({
      success: true,
      stats: {
        totalRooms,
        totalBeds,
        occupiedBeds,
        availableBeds,
      },
      rooms: allRooms,
    });
  } catch (error) {
    console.error('Get Rooms Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching rooms',
    });
  }
};

// @desc    Bulk generate rooms for PG (10-second wizard)
// @route   POST /api/pg/rooms/generate
// @access  Private (Owner, Accepted Editor)
exports.generateRooms = async (req, res) => {
  try {
    const pgId = req.user.pgId;
    const { block, wing, floors = 1, roomsPerFloor = 5, capacity = 2, startFloor = 1 } = req.body;

    const numFloors = parseInt(floors, 10);
    const numRoomsPerFloor = parseInt(roomsPerFloor, 10);
    const numCapacity = parseInt(capacity, 10);
    const startFl = parseInt(startFloor, 10) || 1;

    if (isNaN(numFloors) || numFloors < 1 || numFloors > 50) {
      return res.status(400).json({ success: false, message: 'Floors must be between 1 and 50' });
    }
    if (isNaN(numRoomsPerFloor) || numRoomsPerFloor < 1 || numRoomsPerFloor > 100) {
      return res.status(400).json({ success: false, message: 'Rooms per floor must be between 1 and 100' });
    }
    if (isNaN(numCapacity) || numCapacity < 1 || numCapacity > 10) {
      return res.status(400).json({ success: false, message: 'Capacity must be between 1 and 10 beds per room' });
    }

    const pg = await PG.findById(pgId);
    if (!pg) {
      return res.status(404).json({ success: false, message: 'PG not found' });
    }

    if (!pg.rooms) pg.rooms = [];

    const existingRoomNums = new Set(pg.rooms.map((r) => r.roomNumber.toUpperCase()));
    const newRooms = [];
    const cleanBlock = (block || '').trim().toUpperCase();
    const cleanWing = (wing || '').trim().toUpperCase();

    for (let f = 0; f < numFloors; f++) {
      const floorNum = startFl + f;
      for (let r = 1; r <= numRoomsPerFloor; r++) {
        const roomDigits = r < 10 ? `0${r}` : `${r}`;
        const baseNum = `${floorNum}${roomDigits}`;
        const roomNumber = cleanBlock ? `${cleanBlock}-${baseNum}` : baseNum;

        if (!existingRoomNums.has(roomNumber)) {
          existingRoomNums.add(roomNumber);
          newRooms.push({
            roomNumber,
            block: cleanBlock,
            wing: cleanWing,
            floor: floorNum,
            capacity: numCapacity,
          });
        }
      }
    }

    if (newRooms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All rooms in this sequence already exist in your PG!',
      });
    }

    pg.rooms.push(...newRooms);
    await pg.save();

    return res.status(201).json({
      success: true,
      message: `Successfully generated ${newRooms.length} rooms!`,
      createdCount: newRooms.length,
      rooms: pg.rooms,
    });
  } catch (error) {
    console.error('Generate Rooms Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error generating rooms',
    });
  }
};

// @desc    Add single room to PG
// @route   POST /api/pg/rooms
// @access  Private (Owner, Accepted Editor)
exports.addRoom = async (req, res) => {
  try {
    const pgId = req.user.pgId;
    const { roomNumber, block, wing, floor = 1, capacity = 2 } = req.body;

    if (!roomNumber || !roomNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Room number is required' });
    }

    const cleanRoomNum = roomNumber.trim().toUpperCase();
    const cleanCapacity = parseInt(capacity, 10) || 2;
    const cleanFloor = parseInt(floor, 10) || 1;

    const pg = await PG.findById(pgId);
    if (!pg) {
      return res.status(404).json({ success: false, message: 'PG not found' });
    }

    if (!pg.rooms) pg.rooms = [];

    const exists = pg.rooms.some((r) => r.roomNumber.toUpperCase() === cleanRoomNum);
    if (exists) {
      return res.status(400).json({
        success: false,
        message: `Room ${cleanRoomNum} already exists in your PG`,
      });
    }

    const newRoom = {
      roomNumber: cleanRoomNum,
      block: (block || '').trim().toUpperCase(),
      wing: (wing || '').trim().toUpperCase(),
      floor: cleanFloor,
      capacity: Math.min(10, Math.max(1, cleanCapacity)),
    };

    pg.rooms.push(newRoom);
    await pg.save();

    return res.status(201).json({
      success: true,
      message: `Room ${cleanRoomNum} created successfully`,
      room: newRoom,
    });
  } catch (error) {
    console.error('Add Room Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error adding room',
    });
  }
};

// @desc    Delete a room from PG
// @route   DELETE /api/pg/rooms/:roomId
// @access  Private (Owner ONLY)
exports.deleteRoom = async (req, res) => {
  try {
    const pgId = req.user.pgId;
    const { roomId } = req.params;

    const pg = await PG.findById(pgId);
    if (!pg) {
      return res.status(404).json({ success: false, message: 'PG not found' });
    }

    // Find room by _id or roomNumber
    const room = (pg.rooms || []).find(
      (r) => r._id.toString() === roomId || r.roomNumber.toUpperCase() === roomId.toUpperCase()
    );

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found in your PG' });
    }

    // Check if any active student currently occupies this room
    const activeTenant = await User.findOne({
      pgId,
      role: 'tenant',
      inviteStatus: 'accepted',
      roomNumber: room.roomNumber,
    });

    if (activeTenant) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete Room ${room.roomNumber} because student "${activeTenant.name}" is currently residing in it. Please relocate or remove the student first.`,
      });
    }

    pg.rooms = pg.rooms.filter((r) => r._id.toString() !== room._id.toString());
    await pg.save();

    return res.json({
      success: true,
      message: `Room ${room.roomNumber} deleted successfully`,
    });
  } catch (error) {
    console.error('Delete Room Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting room',
    });
  }
};

// @desc    Update single room details (roomNumber code, block, floor, capacity)
// @route   PUT /api/pg/rooms/:roomId
// @access  Private (Owner ONLY)
exports.updateRoom = async (req, res) => {
  try {
    const pgId = req.user.pgId;
    const { roomId } = req.params;
    const { roomNumber, block, wing, floor, capacity } = req.body;

    if (!roomNumber || !roomNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Room number is required' });
    }

    const cleanRoomNum = roomNumber.trim().toUpperCase();
    const cleanBlock = (block || '').trim().toUpperCase();
    const cleanWing = (wing || '').trim().toUpperCase();
    const cleanFloor = parseInt(floor, 10) || 1;
    const cleanCapacity = Math.min(10, Math.max(1, parseInt(capacity, 10) || 2));

    const pg = await PG.findById(pgId);
    if (!pg) {
      return res.status(404).json({ success: false, message: 'PG not found' });
    }

    const room = (pg.rooms || []).find((r) => r._id.toString() === roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found in your PG' });
    }

    // If roomNumber changed, ensure no conflict with another room
    if (room.roomNumber.toUpperCase() !== cleanRoomNum) {
      const exists = pg.rooms.some(
        (r) => r._id.toString() !== roomId && r.roomNumber.toUpperCase() === cleanRoomNum
      );
      if (exists) {
        return res.status(400).json({
          success: false,
          message: `Room ${cleanRoomNum} already exists in your PG`,
        });
      }

      const oldRoomNum = room.roomNumber;
      room.roomNumber = cleanRoomNum;

      // Automatically update all existing students residing in this room!
      await User.updateMany(
        { pgId, roomNumber: oldRoomNum },
        { $set: { roomNumber: cleanRoomNum } }
      );
    }

    room.block = cleanBlock;
    room.wing = cleanWing;
    room.floor = cleanFloor;
    room.capacity = cleanCapacity;
    await pg.save();

    return res.json({
      success: true,
      message: `Room ${cleanRoomNum} updated successfully!`,
      room,
    });
  } catch (error) {
    console.error('Update Room Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating room',
    });
  }
};

// @desc    Batch rename/update block codes and room prefixes
// @route   POST /api/pg/rooms/rename-block
// @access  Private (Owner ONLY)
exports.renameBlock = async (req, res) => {
  try {
    const pgId = req.user.pgId;
    const { oldBlock, newBlock, oldWing, newWing, oldPrefix, newPrefix } = req.body;

    if (!oldBlock && !oldWing && !oldPrefix) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the current Block, Wing, or Room Prefix to rename',
      });
    }

    const pg = await PG.findById(pgId);
    if (!pg) {
      return res.status(404).json({ success: false, message: 'PG not found' });
    }

    const cleanOldBlock = (oldBlock || '').trim().toUpperCase();
    const cleanNewBlock = (newBlock || '').trim().toUpperCase();
    const cleanOldWing = (oldWing || '').trim().toUpperCase();
    const cleanNewWing = (newWing || '').trim().toUpperCase();
    const cleanOldPrefix = (oldPrefix || '').trim().toUpperCase();
    const cleanNewPrefix = (newPrefix || '').trim().toUpperCase();

    let updatedRoomsCount = 0;
    const roomUpdatesMap = {}; // oldRoomNum -> newRoomNum

    // Clone rooms temporarily to check for duplicates before modifying
    const simulatedRooms = (pg.rooms || []).map((r) => ({
      _id: r._id,
      roomNumber: r.roomNumber,
      block: r.block,
      wing: r.wing,
    }));

    for (const room of simulatedRooms) {
      const roomBlock = (room.block || '').trim().toUpperCase();
      const roomWing = (room.wing || '').trim().toUpperCase();

      const matchBlock = cleanOldBlock && (
        roomBlock === cleanOldBlock ||
        roomBlock === `BLOCK ${cleanOldBlock}` ||
        `BLOCK ${roomBlock}` === cleanOldBlock
      );

      const matchWing = cleanOldWing && (
        roomWing === cleanOldWing ||
        roomWing === `WING ${cleanOldWing}` ||
        `WING ${roomWing}` === cleanOldWing
      );

      const matchPrefix = cleanOldPrefix && room.roomNumber.toUpperCase().startsWith(cleanOldPrefix);

      // Determine target: if block provided, block is primary target.
      let isTarget = false;
      if (cleanOldBlock) {
        isTarget = matchBlock;
      } else if (cleanOldWing) {
        isTarget = matchWing;
      } else if (cleanOldPrefix) {
        isTarget = matchPrefix;
      }

      if (isTarget) {
        if (cleanNewBlock) room.block = cleanNewBlock;
        if (cleanNewWing) room.wing = cleanNewWing;
        if (cleanNewPrefix) {
          const pref = cleanNewPrefix.endsWith('-') ? cleanNewPrefix : `${cleanNewPrefix}-`;
          const parts = room.roomNumber.split('-');
          const digits = parts.length > 1 ? parts[parts.length - 1] : room.roomNumber.replace(/^\D+/, '');
          room.roomNumber = `${pref}${digits}`;
        }
      }
    }

    // Check for duplicate room numbers after simulated rename
    const finalRoomNumbers = simulatedRooms.map((r) => r.roomNumber.toUpperCase());
    const duplicates = finalRoomNumbers.filter((item, index) => finalRoomNumbers.indexOf(item) !== index);
    if (duplicates.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Renaming would create duplicate room numbers (${Array.from(new Set(duplicates)).slice(0, 3).join(', ')}). Please use a distinct prefix, block, or wing name.`,
      });
    }

    // Apply changes to real pg.rooms
    for (const room of pg.rooms || []) {
      const roomBlock = (room.block || '').trim().toUpperCase();
      const roomWing = (room.wing || '').trim().toUpperCase();

      const matchBlock = cleanOldBlock && (
        roomBlock === cleanOldBlock ||
        roomBlock === `BLOCK ${cleanOldBlock}` ||
        `BLOCK ${roomBlock}` === cleanOldBlock
      );

      const matchWing = cleanOldWing && (
        roomWing === cleanOldWing ||
        roomWing === `WING ${cleanOldWing}` ||
        `WING ${roomWing}` === cleanOldWing
      );

      const matchPrefix = cleanOldPrefix && room.roomNumber.toUpperCase().startsWith(cleanOldPrefix);

      let isTarget = false;
      if (cleanOldBlock) {
        isTarget = matchBlock;
      } else if (cleanOldWing) {
        isTarget = matchWing;
      } else if (cleanOldPrefix) {
        isTarget = matchPrefix;
      }

      if (isTarget) {
        updatedRoomsCount++;
        if (cleanNewBlock) room.block = cleanNewBlock;
        if (cleanNewWing) room.wing = cleanNewWing;
        if (cleanNewPrefix) {
          const pref = cleanNewPrefix.endsWith('-') ? cleanNewPrefix : `${cleanNewPrefix}-`;
          const parts = room.roomNumber.split('-');
          const digits = parts.length > 1 ? parts[parts.length - 1] : room.roomNumber.replace(/^\D+/, '');
          const oldNum = room.roomNumber;
          const newNum = `${pref}${digits}`;
          room.roomNumber = newNum;
          roomUpdatesMap[oldNum] = newNum;
        }
      }
    }

    if (updatedRoomsCount === 0) {
      return res.status(404).json({
        success: false,
        message: `No rooms found matching "${oldBlock || oldWing || oldPrefix}"`,
      });
    }

    await pg.save();

    // Automatically update student room records for any renamed rooms
    for (const [oldRoomNum, newRoomNum] of Object.entries(roomUpdatesMap)) {
      await User.updateMany(
        { pgId, roomNumber: oldRoomNum },
        { $set: { roomNumber: newRoomNum } }
      );
    }

    return res.json({
      success: true,
      message: `Successfully updated ${updatedRoomsCount} rooms! ${Object.keys(roomUpdatesMap).length > 0 ? 'All resident student records have been synchronized.' : ''}`,
      updatedCount: updatedRoomsCount,
    });
  } catch (error) {
    console.error('Rename Block Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error renaming block code',
    });
  }
};


