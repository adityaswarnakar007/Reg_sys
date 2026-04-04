const mongoose = require('mongoose');

const passwordHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  changedAt: {
    type: Date,
    default: Date.now
  }
});

// Keep only last 3 passwords per user
passwordHistorySchema.statics.addEntry = async function(userId, passwordHash) {
  await this.create({ userId, passwordHash });
  const entries = await this.find({ userId }).sort({ changedAt: -1 });
  if (entries.length > 3) {
    const toDelete = entries.slice(3).map(e => e._id);
    await this.deleteMany({ _id: { $in: toDelete } });
  }
};

// Check if password was recently used
passwordHistorySchema.statics.isRecentlyUsed = async function(userId, plainPassword) {
  const bcrypt = require('bcryptjs');
  const entries = await this.find({ userId }).sort({ changedAt: -1 }).limit(3);
  for (const entry of entries) {
    if (await bcrypt.compare(plainPassword, entry.passwordHash)) {
      return true;
    }
  }
  return false;
};

module.exports = mongoose.model('PasswordHistory', passwordHistorySchema);
