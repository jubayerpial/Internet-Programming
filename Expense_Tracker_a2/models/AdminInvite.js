// Author: Al Jubayer Pial (UTS; ID: 25540865)
const mongoose = require('mongoose');
const crypto = require('crypto');

const adminInviteSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(24).toString('hex')
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    used: {
      type: Boolean,
      default: false
    },
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }
  },
  { timestamps: true }
);

// Virtual: is this token still valid?
adminInviteSchema.virtual('isValid').get(function () {
  return !this.used && this.expiresAt > new Date();
});

module.exports = mongoose.model('AdminInvite', adminInviteSchema);
