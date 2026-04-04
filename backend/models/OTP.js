const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    enum: ['registration', 'login', 'password_reset'],
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 5 * 60 * 1000)
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // Auto-delete after 10 minutes
  }
});

module.exports = mongoose.model('OTP', otpSchema);
