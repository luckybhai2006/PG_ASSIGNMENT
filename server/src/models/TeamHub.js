const mongoose = require('mongoose');

const staffTaskSchema = new mongoose.Schema(
  {
    pgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PG',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    category: {
      type: String,
      enum: ['Cleaning', 'Maintenance', 'Plumbing', 'Electrical', 'Tenant Help', 'Security', 'Other'],
      default: 'Maintenance',
    },
    roomNumber: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Assigned', 'In Progress', 'Done'],
      default: 'Assigned',
      index: true,
    },
    completionNote: {
      type: String,
      trim: true,
      default: '',
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const teamMessageSchema = new mongoose.Schema(
  {
    pgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PG',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
    },
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    attachedTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StaffTask',
    },
  },
  { timestamps: true }
);

// High performance compound indexes
staffTaskSchema.index({ pgId: 1, status: 1, createdAt: -1 });
staffTaskSchema.index({ pgId: 1, assignedTo: 1, status: 1 });
teamMessageSchema.index({ pgId: 1, createdAt: -1 });

const StaffTask = mongoose.model('StaffTask', staffTaskSchema);
const TeamMessage = mongoose.model('TeamMessage', teamMessageSchema);

module.exports = { StaffTask, TeamMessage };

