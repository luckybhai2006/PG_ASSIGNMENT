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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PG', pgSchema);
