const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockUntil: {
    type: Date
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lastPasswordChange: {
    type: Date,
    default: Date.now
  },
  passwordExpiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
  refreshToken: {
    type: String,
    select: false
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
userSchema.methods.isAccountLocked = function() {
  if (this.isLocked && this.lockUntil && this.lockUntil > Date.now()) {
    return true;
  }
  if (this.isLocked && this.lockUntil && this.lockUntil <= Date.now()) {
    this.isLocked = false;
    this.failedLoginAttempts = 0;
    this.lockUntil = undefined;
    this.save();
    return false;
  }
  return false;
};

// Check if password is expired
userSchema.methods.isPasswordExpired = function() {
  return this.passwordExpiresAt && this.passwordExpiresAt < Date.now();
};

module.exports = mongoose.model('User', userSchema);
