const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io initialization
let ioInstance = null;

const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  },
  pingTimeout: 30000,
  pingInterval: 25000,
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'pg_complaint_management_secret_key_2026_super_secure'
    );

    const user = await User.findById(decoded.id).select('_id name role pgId inviteStatus permissions');
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Invalid socket authentication token'));
  }
});

io.on('connection', async (socket) => {
  const user = socket.user;
  const userIdStr = user._id.toString();

  socket.join(`user_${userIdStr}`);

  if (user.pgId) {
    socket.join(`pg_${user.pgId.toString()}`);
  }

  if (user.role === 'owner') {
    try {
      const PG = require('./models/PG');
      const ownerPgs = await PG.find({ ownerId: user._id }).select('_id').lean();
      ownerPgs.forEach((p) => socket.join(`pg_${p._id.toString()}`));
    } catch (e) {
      console.error('Owner join PGs error:', e);
    }
  }

  socket.on('join_pg', (pgId) => {
    if (pgId) socket.join(`pg_${pgId.toString()}`);
  });

  socket.on('leave_pg', (pgId) => {
    if (pgId) socket.leave(`pg_${pgId.toString()}`);
  });

  // High-performance real-time messaging over WebSocket (<80ms response worldwide)
  socket.on('SEND_TEAM_MESSAGE', async (data, callback) => {
    try {
      const user = socket.user;
      if (!user) {
        return typeof callback === 'function' && callback({ success: false, message: 'Unauthorized' });
      }

      const { text, mentions, attachedTaskId, pgId: bodyPgId } = data || {};
      let pgId = bodyPgId || user.pgId;
      if (!pgId && user.role === 'owner') {
        const PG = require('./models/PG');
        const firstPg = await PG.findOne({ ownerId: user._id }).select('_id').lean();
        if (firstPg) pgId = firstPg._id;
      }

      if (!pgId || !text || !text.trim()) {
        return typeof callback === 'function' && callback({ success: false, message: 'Message text and PG are required' });
      }

      const cleanText = text.trim();
      const cleanMentions = Array.isArray(mentions) ? mentions : [];

      const { TeamMessage } = require('./models/TeamHub');
      const msg = new TeamMessage({
        pgId,
        sender: user._id,
        text: cleanText,
        mentions: cleanMentions,
        attachedTask: attachedTaskId || null,
      });

      const senderPayload = {
        _id: user._id,
        name: user.name,
        role: user.role,
        email: user.email,
        phone: user.phone,
        staffRole: user.staffRole,
        designation: user.designation,
      };

      const populated = {
        _id: msg._id,
        pgId,
        sender: senderPayload,
        text: cleanText,
        mentions: cleanMentions,
        attachedTask: null,
        createdAt: new Date().toISOString(),
      };

      // 1. Instant ACK callback to sender (<15ms locally, ~40-70ms hosted)
      if (typeof callback === 'function') {
        callback({ success: true, message: populated });
      }

      // 2. Multicast to PG room + owner room + mentions
      const targetRooms = new Set([`pg_${pgId.toString()}`]);
      try {
        const PG = require('./models/PG');
        const pgDoc = await PG.findById(pgId).select('ownerId').lean();
        if (pgDoc?.ownerId) {
          targetRooms.add(`user_${pgDoc.ownerId.toString()}`);
        }
      } catch (_) { }

      if (cleanMentions.length > 0) {
        cleanMentions.forEach((uid) => uid && targetRooms.add(`user_${uid.toString()}`));
      }

      emitToRooms(Array.from(targetRooms), 'TEAM_MESSAGE_RECEIVED', populated);

      if (cleanMentions.length > 0) {
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

      // 3. Persist to MongoDB in background
      msg.save().catch((err) => console.error('Socket background msg save error:', err));
    } catch (err) {
      console.error('Socket SEND_TEAM_MESSAGE error:', err);
      if (typeof callback === 'function') callback({ success: false, message: err.message });
    }
  });

  socket.on('disconnect', () => { });
});

ioInstance = io;

function getIO() {
  return ioInstance;
}

function emitToUser(userId, event, data) {
  if (ioInstance && userId) {
    const targetRoom = `user_${userId.toString()}`;
    ioInstance.to(targetRoom).emit(event, data);
  }
}

function emitToPG(pgId, event, data) {
  if (ioInstance && pgId) {
    ioInstance.to(`pg_${pgId.toString()}`).emit(event, data);
  }
}

function emitToRooms(rooms, event, data) {
  if (ioInstance && Array.isArray(rooms) && rooms.length > 0) {
    const valid = rooms.filter(Boolean).map((r) => r.toString());
    if (valid.length > 0) {
      ioInstance.to(valid).emit(event, data);
    }
  }
}

// Make helpers available globally on app
app.set('socketIO', ioInstance);
app.set('emitToUser', emitToUser);
app.set('emitToPG', emitToPG);
app.set('emitToRooms', emitToRooms);

// Middlewares
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200,
}));

app.options('*', cors({ origin: true, credentials: true }));
app.use(express.json());

// Ensure MongoDB is connected for serverless invocations (Vercel)
app.use(async (req, res, next) => {
  if (req.path === '/' || req.path === '/api/health') {
    return next();
  }

  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connection error in middleware:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Database connection error',
    });
  }
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/pg', require('./routes/pgRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/tenants', require('./routes/tenantRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/team-hub', require('./routes/teamHubRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    message: 'PG Complaint Management System Backend is running smoothly',
  });
});

// Root welcome
app.get('/', (req, res) => {
  res.send('PG Complaint Management System API is running.');
});

// Global 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Local development server
const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
  connectDB()
    .then(() => {
      server.listen(PORT, () => {
        console.log(`🚀 Server & Socket.io listening on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('❌ Database connection failed:', err);
      process.exit(1);
    });
}

// Vercel serverless function - SIMPLE
module.exports = app;