const { StaffTask, TeamMessage } = require('../models/TeamHub');
const User = require('../models/User');

// Helper to check chat permission
const canUserChat = (user) => {
  if (!user) return false;
  if (user.role === 'owner') return true;
  if (['editor', 'manager', 'staff'].includes(user.role)) {
    return user.permissions?.canChat !== false;
  }
  return false;
};

// Helper to check task assignment permission (Manager capability)
const canUserAssign = (user) => {
  if (!user) return false;
  if (user.role === 'owner' || user.role === 'manager') return true;
  if (['editor', 'staff'].includes(user.role)) {
    return user.permissions?.canAssignTasks === true;
  }
  return false;
};

// @desc    Get team messages for PG branch
// @route   GET /api/team-hub/messages
// @access  Private (Owner / Editor with canChat)
exports.getMessages = async (req, res) => {
  try {
    const user = req.user;
    let pgId = req.query.pgId || user.pgId;
    if (!pgId && user.role === 'owner') {
      const PG = require('../models/PG');
      const firstPg = await PG.findOne({ ownerId: user._id }).select('_id').lean();
      if (firstPg) pgId = firstPg._id;
    }

    if (!pgId) {
      return res.status(400).json({ success: false, message: 'No PG facility associated' });
    }

    // All staff team members and owners can view the messages for their branch
    if (!user || !['owner', 'editor', 'manager', 'staff'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to access team chat' });
    }

    const query = { pgId };
    if (req.query.since) {
      const sinceDate = new Date(req.query.since);
      if (!isNaN(sinceDate.getTime())) {
        query.createdAt = { $gt: sinceDate };
      }
    }

    // High-concurrency delta sync: return only newly created messages since timestamp
    if (req.query.since) {
      const deltaMessages = await TeamMessage.find(query)
        .sort({ createdAt: 1 })
        .limit(50)
        .populate('sender', 'name role email phone staffRole designation')
        .populate('attachedTask')
        .lean();

      return res.json({ success: true, messages: deltaMessages, isDelta: true });
    }

    // Baseline load: fetch recent 80 messages
    const messages = await TeamMessage.find({ pgId })
      .sort({ createdAt: -1 })
      .limit(80)
      .populate('sender', 'name role email phone staffRole designation')
      .populate('attachedTask')
      .lean();

    return res.json({ success: true, messages: messages.reverse(), isDelta: false });
  } catch (error) {
    console.error('getMessages error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Send a message in team chat
// @route   POST /api/team-hub/messages
// @access  Private (Owner / Editor with canChat)
exports.sendMessage = async (req, res) => {
  try {
    const user = req.user;
    const { text, mentions, attachedTaskId, pgId: bodyPgId } = req.body;
    let pgId = bodyPgId || user.pgId;
    if (!pgId && user.role === 'owner') {
      const PG = require('../models/PG');
      const firstPg = await PG.findOne({ ownerId: user._id }).select('_id').lean();
      if (firstPg) pgId = firstPg._id;
    }

    if (!pgId) {
      return res.status(400).json({ success: false, message: 'No PG facility associated' });
    }

    if (!canUserChat(user)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to post messages' });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const cleanText = text.trim();
    const cleanMentions = Array.isArray(mentions) ? mentions : [];

    const msg = new TeamMessage({
      pgId,
      sender: user._id,
      text: cleanText,
      mentions: cleanMentions,
      attachedTask: attachedTaskId || null,
    });

    // In-memory populated sender object (avoids an expensive second MongoDB Read + Join query)
    const senderPayload = {
      _id: user._id,
      name: user.name,
      role: user.role,
      email: user.email,
      phone: user.phone,
      staffRole: user.staffRole,
      designation: user.designation,
    };

    let populated = {
      _id: msg._id,
      pgId,
      sender: senderPayload,
      text: cleanText,
      mentions: cleanMentions,
      attachedTask: null,
      createdAt: new Date().toISOString(),
    };

    if (attachedTaskId) {
      const taskDoc = await require('../models/TeamHub').StaffTask.findById(attachedTaskId).lean();
      populated.attachedTask = taskDoc || null;
    }

    // 1. INSTANT WEBSOCKET BROADCAST (<1ms):
    // Broadcast immediately to PG room and mentioned users so recipient receives the message in true milliseconds
    const emitToPG = req.app.get('emitToPG');
    const emitToUser = req.app.get('emitToUser');

    if (emitToPG) {
      emitToPG(pgId, 'TEAM_MESSAGE_RECEIVED', populated);
    }

    // Direct mention alerts for user-specific toasts
    if (emitToUser && cleanMentions.length > 0) {
      cleanMentions.forEach((uid) => {
        if (uid && uid.toString() !== user._id.toString()) {
          emitToUser(uid, 'TEAM_MENTIONED', {
            senderName: user.name,
            text: cleanText.slice(0, 100),
            messageId: msg._id,
          });
        }
      });
    }

    // 2. Respond immediately to the client (<1ms) so network tab latency drops to bare minimum ping
    res.status(201).json({ success: true, message: populated });

    // 3. Persist to MongoDB in background without blocking HTTP response
    msg.save().catch((err) => {
      console.error('Background message save error:', err);
    });
  } catch (error) {
    console.error('sendMessage error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get team tasks
// @route   GET /api/team-hub/tasks
// @access  Private (Owner / Editor)
exports.getTasks = async (req, res) => {
  try {
    const user = req.user;
    let pgId = req.query.pgId || user.pgId;
    const { status, mine } = req.query;
    const query = {};

    if (pgId) {
      query.pgId = pgId;
    } else if (user.role === 'owner') {
      const PG = require('../models/PG');
      const pgs = await PG.find({ ownerId: user._id }).select('_id').lean();
      if (pgs.length > 0) {
        query.pgId = { $in: pgs.map((p) => p._id) };
      }
    } else {
      query.assignedTo = user._id;
    }

    if (status) {
      query.status = status;
    }
    if (mine === 'true') {
      query.assignedTo = user._id;
    }

    const tasks = await StaffTask.find(query)
      .sort({ createdAt: -1 })
      .populate('assignedBy', 'name role email')
      .populate('assignedTo', 'name role email phone staffRole designation')
      .lean();

    return res.json({ success: true, tasks });
  } catch (error) {
    console.error('getTasks error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Create / Assign a task (Manager / Owner)
// @route   POST /api/team-hub/tasks
// @access  Private (Owner OR Editor with canAssignTasks)
exports.createTask = async (req, res) => {
  try {
    const user = req.user;
    const { title, description, assignedTo, priority, category, roomNumber, postToChat, pgId: bodyPgId } = req.body;

    if (!canUserAssign(user)) {
      return res.status(403).json({ success: false, message: 'Owner has not granted you task assignment permissions' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }

    if (!assignedTo) {
      return res.status(400).json({ success: false, message: 'Assignee staff member is required' });
    }

    const targetStaff = await User.findById(assignedTo);
    if (!targetStaff) {
      return res.status(404).json({ success: false, message: 'Selected staff member not found' });
    }

    let pgId = bodyPgId || user.pgId || targetStaff.pgId;
    if (!pgId && user.role === 'owner') {
      const PG = require('../models/PG');
      const firstPg = await PG.findOne({ ownerId: user._id }).select('_id').lean();
      if (firstPg) pgId = firstPg._id;
    }

    if (!pgId) {
      return res.status(400).json({ success: false, message: 'No PG facility associated' });
    }

    const task = new StaffTask({
      pgId,
      title: title.trim(),
      description: description ? description.trim() : '',
      assignedBy: user._id,
      assignedTo,
      priority: priority || 'Medium',
      category: category || 'Maintenance',
      roomNumber: roomNumber ? roomNumber.trim() : '',
      status: 'Assigned',
    });

    await task.save();

    const populatedTask = await StaffTask.findById(task._id)
      .populate('assignedBy', 'name role email')
      .populate('assignedTo', 'name role email phone staffRole designation')
      .lean();

    let populatedChat = null;
    // Optionally post task card into team chat
    if (postToChat && canUserChat(user)) {
      const chatMsg = new TeamMessage({
        pgId,
        sender: user._id,
        text: `📌 Assigned task to @${targetStaff.name}: "${task.title}"`,
        mentions: [targetStaff._id],
        attachedTask: task._id,
      });
      await chatMsg.save();

      populatedChat = await TeamMessage.findById(chatMsg._id)
        .populate('sender', 'name role email phone staffRole designation')
        .populate('attachedTask')
        .lean();

      const targetRooms = new Set([`pg_${pgId.toString()}`]);
      if (targetStaff.pgId && targetStaff.pgId.toString() !== pgId.toString()) {
        targetRooms.add(`pg_${targetStaff.pgId.toString()}`);
      }
      targetRooms.add(`user_${assignedTo.toString()}`);

      const emitToRooms = req.app.get('emitToRooms');
      const emitToPG = req.app.get('emitToPG');
      if (emitToRooms) {
        emitToRooms(Array.from(targetRooms), 'TEAM_MESSAGE_RECEIVED', populatedChat);
      } else if (emitToPG) {
        emitToPG(pgId, 'TEAM_MESSAGE_RECEIVED', populatedChat);
      }

      const emitToUser = req.app.get('emitToUser');
      if (emitToUser && user._id.toString() !== assignedTo.toString()) {
        emitToUser(assignedTo, 'TEAM_MENTIONED', {
          senderName: user.name,
          text: populatedChat.text,
          messageId: populatedChat._id,
        });
      }
    }

    // Socket notification to assigned staff & PG
    const emitToUser = req.app.get('emitToUser');
    if (emitToUser) {
      emitToUser(assignedTo, 'TASK_ASSIGNED', {
        task: populatedTask,
        assignedByName: user.name,
        message: `${user.name} assigned you: "${task.title}"`,
      });
    }

    const emitToPG = req.app.get('emitToPG');
    if (emitToPG) {
      emitToPG(pgId, 'TASK_CREATED', populatedTask);
      if (targetStaff.pgId && targetStaff.pgId.toString() !== pgId.toString()) {
        emitToPG(targetStaff.pgId, 'TASK_CREATED', populatedTask);
      }
    }

    return res.status(201).json({ success: true, task: populatedTask, chatMessage: populatedChat });
  } catch (error) {
    console.error('createTask error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Update task status (In Progress / Done)
// @route   PATCH /api/team-hub/tasks/:id/status
// @access  Private (Assigned Staff / Manager / Owner)
exports.updateTaskStatus = async (req, res) => {
  try {
    const user = req.user;
    const { status, completionNote } = req.body;

    const task = await StaffTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Authorization: Assigned staff, Assigning manager, or Owner
    const isAssignee = task.assignedTo.toString() === user._id.toString();
    const isAssigner = task.assignedBy.toString() === user._id.toString();
    const isOwner = user.role === 'owner';

    if (!isAssignee && !isAssigner && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this task' });
    }

    if (status) {
      task.status = status;
      if (status === 'Done') {
        task.completedAt = new Date();
        if (completionNote) task.completionNote = completionNote.trim();
      }
    }

    await task.save();

    const populated = await StaffTask.findById(task._id)
      .populate('assignedBy', 'name role email')
      .populate('assignedTo', 'name role email phone staffRole designation')
      .lean();

    const emitToPG = req.app.get('emitToPG');
    if (emitToPG) {
      emitToPG(task.pgId, 'TASK_STATUS_UPDATED', populated);
    }

    const emitToUser = req.app.get('emitToUser');
    if (emitToUser) {
      emitToUser(task.assignedTo, 'TASK_STATUS_UPDATED', populated);
      if (status === 'Done') {
        const payload = {
          task: populated,
          completedByName: user.name,
          message: `${user.name} marked task "${task.title}" as Done!`,
        };
        // Notify the person who assigned the task
        if (!isAssigner) {
          emitToUser(task.assignedBy, 'TASK_COMPLETED', payload);
        }
        // Also notify the PG's Owner if not already the assigner or completer
        try {
          const PG = require('../models/PG');
          const pgDoc = await PG.findById(task.pgId).select('ownerId').lean();
          if (
            pgDoc?.ownerId &&
            pgDoc.ownerId.toString() !== user._id.toString() &&
            pgDoc.ownerId.toString() !== task.assignedBy.toString()
          ) {
            emitToUser(pgDoc.ownerId, 'TASK_COMPLETED', payload);
          }
        } catch (_) {}
      }
    }

    return res.json({ success: true, task: populated });
  } catch (error) {
    console.error('updateTaskStatus error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
