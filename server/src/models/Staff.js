const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    pgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PG',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    staffRole: {
      type: String,
      enum: ['manager', 'staff'],
      default: 'staff',
      index: true,
    },
    designation: {
      type: String,
      trim: true,
      default: 'Staff Member', // e.g. 'Property Manager', 'Housekeeping', 'Electrician', 'Security'
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'active',
    },
  },
  { timestamps: true }
);

staffSchema.index({ pgId: 1, staffRole: 1 });

module.exports = mongoose.model('Staff', staffSchema);
