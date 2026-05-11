// Author: Al Jubayer Pial (UTS; ID: 25540865)
const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    action: {
      type: String,
      required: true,
      // e.g. 'login', 'logout', 'create_expense', 'update_expense', 'delete_expense', 'register'
    },
    detail: {
      type: String,
      default: ''
    },
    ip: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserActivity', userActivitySchema);
