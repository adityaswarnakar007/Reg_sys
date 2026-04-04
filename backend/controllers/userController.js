const bcrypt = require('bcryptjs');
const User = require('../models/User');
const PasswordHistory = require('../models/PasswordHistory');
const LoginActivity = require('../models/LoginActivity');

// GET /api/user/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      isVerified: user.isVerified,
      lastPasswordChange: user.lastPasswordChange,
      passwordExpiresAt: user.passwordExpiresAt,
      passwordExpired: user.isPasswordExpired(),
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// PUT /api/user/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Check password history
    const isReused = await PasswordHistory.isRecentlyUsed(user._id, newPassword);
    if (isReused) {
      return res.status(400).json({ error: 'Cannot reuse any of your last 3 passwords' });
    }

    user.password = newPassword;
    user.lastPasswordChange = new Date();
    user.passwordExpiresAt = new Date(Date.now() + (parseInt(process.env.PASSWORD_EXPIRY_DAYS) || 30) * 24 * 60 * 60 * 1000);
    await user.save();

    // Add to password history
    await PasswordHistory.addEntry(user._id, user.password);

    // Log activity
    await LoginActivity.create({
      userId: user._id,
      action: 'password_change',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

// GET /api/user/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const [recentActivity, failedAttempts, suspiciousActivity, user] = await Promise.all([
      LoginActivity.find({ userId }).sort({ timestamp: -1 }).limit(20),
      LoginActivity.countDocuments({ userId, action: 'login_failed', timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
      LoginActivity.find({ userId, isSuspicious: true }).sort({ timestamp: -1 }).limit(10),
      User.findById(userId)
    ]);

    res.json({
      user: {
        username: user.username,
        email: user.email,
        lastPasswordChange: user.lastPasswordChange,
        passwordExpiresAt: user.passwordExpiresAt,
        passwordExpired: user.isPasswordExpired(),
        memberSince: user.createdAt
      },
      recentActivity,
      failedAttemptsLast7Days: failedAttempts,
      suspiciousActivity,
      stats: {
        totalLogins: await LoginActivity.countDocuments({ userId, action: 'login_success' }),
        totalFailedAttempts: await LoginActivity.countDocuments({ userId, action: 'login_failed' })
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};
