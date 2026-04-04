const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const UAParser = require('ua-parser-js');
const User = require('../models/User');
const OTP = require('../models/OTP');
const PasswordHistory = require('../models/PasswordHistory');
const LoginActivity = require('../models/LoginActivity');
const { sendOTPEmail } = require('../utils/email');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokens');

const getClientInfo = (req) => {
  const parser = new UAParser(req.headers['user-agent']);
  const result = parser.getResult();
  return {
    ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
    userAgent: req.headers['user-agent'] || 'Unknown',
    browser: `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim(),
    os: `${result.os.name || 'Unknown'} ${result.os.version || ''}`.trim(),
    device: result.device.type || 'desktop'
  };
};

const logActivity = async (userId, action, req, details = '', isSuspicious = false) => {
  const info = getClientInfo(req);
  await LoginActivity.create({ userId, action, ...info, details, isSuspicious });
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || '')
      .toLowerCase()
      .trim();
    const genericMessage =
      'If an account exists with this email, a password reset code has been sent.';

    const user = await User.findOne({ email });
    if (!user || !user.isVerified) {
      return res.json({ message: genericMessage });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);

    await OTP.deleteMany({ email: user.email, purpose: 'password_reset' });
    await OTP.create({ email: user.email, otp: hashedOTP, purpose: 'password_reset' });
    await sendOTPEmail(user.email, otp, 'password_reset');
    await logActivity(user._id, 'password_reset_request', req);

    res.json({ message: genericMessage });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: 'Account not verified' });
    }

    if (newPassword.toLowerCase().includes(user.username.toLowerCase())) {
      return res.status(400).json({ error: 'Password must not contain your username' });
    }

    const otpRecord = await OTP.findOne({ email, purpose: 'password_reset' }).sort({ createdAt: -1 });
    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    if (otpRecord.expiresAt < Date.now()) {
      await OTP.deleteMany({ email, purpose: 'password_reset' });
      return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
    }

    if (otpRecord.attempts >= 5) {
      await OTP.deleteMany({ email, purpose: 'password_reset' });
      return res.status(429).json({ error: 'Too many attempts. Please request a new reset code.' });
    }

    const isValid = await bcrypt.compare(otp, otpRecord.otp);
    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({
        error: 'Invalid code',
        attemptsRemaining: 5 - otpRecord.attempts
      });
    }

    await OTP.deleteMany({ email, purpose: 'password_reset' });

    const isReused = await PasswordHistory.isRecentlyUsed(user._id, newPassword);
    if (isReused) {
      return res.status(400).json({ error: 'Cannot reuse any of your last 3 passwords' });
    }

    user.password = newPassword;
    user.lastPasswordChange = new Date();
    user.passwordExpiresAt = new Date(
      Date.now() + (parseInt(process.env.PASSWORD_EXPIRY_DAYS) || 30) * 24 * 60 * 60 * 1000
    );
    user.failedLoginAttempts = 0;
    user.isLocked = false;
    user.lockUntil = undefined;
    user.refreshToken = undefined;
    await user.save();

    await PasswordHistory.addEntry(user._id, user.password);
    await logActivity(user._id, 'password_reset', req);

    res.clearCookie('refreshToken');
    res.json({ message: 'Password reset successfully. You can now sign in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check existing user
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({
        error: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      });
    }

    // Create user (password hashed by pre-save hook)
    const user = await User.create({ username, email, password });

    // Store initial password in history
    await PasswordHistory.addEntry(user._id, user.password);

    // Generate and send OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);

    await OTP.deleteMany({ email, purpose: 'registration' });
    await OTP.create({ email, otp: hashedOTP, purpose: 'registration' });
    await sendOTPEmail(email, otp, 'registration');

    res.status(201).json({
      message: 'Registration successful. Please verify your email with the OTP sent.',
      userId: user._id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

// POST /api/auth/verify-otp
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp, purpose } = req.body;

    const otpRecord = await OTP.findOne({ email, purpose }).sort({ createdAt: -1 });
    if (!otpRecord) {
      return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
    }

    if (otpRecord.expiresAt < Date.now()) {
      await OTP.deleteMany({ email, purpose });
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (otpRecord.attempts >= 5) {
      await OTP.deleteMany({ email, purpose });
      return res.status(429).json({ error: 'Too many attempts. Please request a new OTP.' });
    }

    const isValid = await bcrypt.compare(otp, otpRecord.otp);
    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ error: 'Invalid OTP', attemptsRemaining: 5 - otpRecord.attempts });
    }

    await OTP.deleteMany({ email, purpose });

    if (purpose === 'registration') {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ error: 'User not found' });

      user.isVerified = true;

      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      user.refreshToken = refreshToken;
      await user.save();

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.json({
        message: 'Email verified successfully',
        accessToken,
        user: { id: user._id, username: user.username, email: user.email },
        passwordExpired: user.isPasswordExpired()
      });
    }

    if (purpose === 'login') {
      const user = await User.findOne({ email });
      await logActivity(user._id, 'otp_verified', req);

      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      user.refreshToken = refreshToken;
      await user.save();

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.json({
        message: 'Login successful',
        accessToken,
        user: { id: user._id, username: user.username, email: user.email },
        passwordExpired: user.isPasswordExpired()
      });
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: 'Please verify your email first' });
    }

    if (user.isAccountLocked()) {
      const lockMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
      await logActivity(user._id, 'login_failed', req, 'Account locked', true);
      return res.status(423).json({
        error: `Account locked. Try again in ${lockMinutes} minutes.`
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;

      if (user.failedLoginAttempts >= maxAttempts) {
        user.isLocked = true;
        user.lockUntil = new Date(Date.now() + (parseInt(process.env.LOCK_TIME_MINUTES) || 30) * 60000);
        await user.save();
        await logActivity(user._id, 'account_locked', req, `Locked after ${maxAttempts} failed attempts`, true);
        return res.status(423).json({ error: 'Account locked due to too many failed attempts' });
      }

      await user.save();
      await logActivity(user._id, 'login_failed', req, `Attempt ${user.failedLoginAttempts}/${maxAttempts}`);
      return res.status(401).json({
        error: 'Invalid email or password',
        attemptsRemaining: maxAttempts - user.failedLoginAttempts
      });
    }

    // Reset failed attempts
    user.failedLoginAttempts = 0;
    user.isLocked = false;
    user.lockUntil = undefined;
    await user.save();

    // Send login OTP for 2FA
    const otp = crypto.randomInt(100000, 999999).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);

    await OTP.deleteMany({ email, purpose: 'login' });
    await OTP.create({ email, otp: hashedOTP, purpose: 'login' });
    await sendOTPEmail(email, otp, 'login');

    await logActivity(user._id, 'login_success', req, 'OTP sent for 2FA');

    res.json({ message: 'OTP sent to your email for verification', requireOTP: true });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// POST /api/auth/resend-otp
exports.resendOTP = async (req, res) => {
  try {
    const { email, purpose } = req.body;

    // Rate limit: check if OTP was sent recently
    const recentOTP = await OTP.findOne({ email, purpose, createdAt: { $gt: new Date(Date.now() - 60000) } });
    if (recentOTP) {
      return res.status(429).json({ error: 'Please wait at least 1 minute before requesting a new OTP' });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);

    await OTP.deleteMany({ email, purpose });
    await OTP.create({ email, otp: hashedOTP, purpose });
    await sendOTPEmail(email, otp, purpose);

    res.json({ message: 'New OTP sent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
};

// POST /api/auth/refresh-token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const newAccessToken = generateAccessToken(user._id);
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      const decoded = verifyRefreshToken(refreshToken);
      const user = await User.findById(decoded.id);
      if (user) {
        user.refreshToken = undefined;
        await user.save();
        await logActivity(user._id, 'logout', req);
      }
    }

    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out' });
  }
};
