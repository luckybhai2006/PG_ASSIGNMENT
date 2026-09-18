const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'manager', 'staff', 'tenant'],
      required: [true, 'Role is required'],
      default: 'tenant',
    },
    staffRole: {
      type: String,
      enum: ['manager', 'staff'],
      default: 'staff',
    },
    designation: {
      type: String,
      trim: true,
      default: '',
    },
    pgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PG',
    },
    inviteStatus: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'vacated'],
      default: 'accepted',
    },
    roomNumber: {
      type: String,
      trim: true,
    },
    lastRoomNumber: {
      type: String,
      trim: true,
    },
    vacatedAt: {
      type: Date,
    },
    vacatedReason: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      default: 'male',
    },
    permissions: {
      manageRooms: { type: Boolean, default: true },
      manageMaintenance: { type: Boolean, default: true },
      manageTenants: { type: Boolean, default: true },
      manageComplaints: { type: Boolean, default: true },
      manageNotices: { type: Boolean, default: true },
      canChat: { type: Boolean, default: true },
      canAssignTasks: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password prior to saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove password from JSON representation
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// High performance compound indexes for fast tenant and staff lookup
userSchema.index({ pgId: 1, role: 1, inviteStatus: 1 });
userSchema.index({ pgId: 1, role: 1 });

module.exports = mongoose.model('User', userSchema);
