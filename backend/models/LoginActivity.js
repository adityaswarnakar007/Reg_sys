const mongoose = require('mongoose');

const loginActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: [
      'login_success',
      'login_failed',
      'logout',
      'password_change',
      'password_reset',
      'password_reset_request',
      'account_locked',
      'otp_verified'
    ],
    required: true
  },
  ipAddress: {
    type: String,
    default: 'Unknown'
  },
  userAgent: {
    type: String,
    default: 'Unknown'
  },
  browser: String,
  os: String,
  device: String,
  isSuspicious: {
    type: Boolean,
    default: false
  },
  details: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('LoginActivity', loginActivitySchema);
