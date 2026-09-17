const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  priority: {
    type: String,
    enum: ['normal', 'urgent'],
    default: 'normal',
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const pgSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'PG Name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'PG Address is required'],
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    rules: [
      {
        type: String,
        trim: true,
      },
    ],
    noticeBoard: [noticeSchema],
    joinCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
  },
  {
    timestamps: true,
  }
);

pgSchema.pre('save', function (next) {
  if (!this.joinCode) {
    const prefix = (this.name || 'PG')
      .replace(/[^A-Za-z]/g, '')
      .slice(0, 2)
      .toUpperCase() || 'PG';
    this.joinCode = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  next();
});

module.exports = mongoose.model('PG', pgSchema);
