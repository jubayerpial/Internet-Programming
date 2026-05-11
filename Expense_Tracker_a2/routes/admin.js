// Author: Al Jubayer Pial (UTS; ID: 25540865)
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Expense = require('../models/Expense');
const UserActivity = require('../models/UserActivity');
const AdminInvite = require('../models/AdminInvite');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

// GET /api/admin/users — list all users with expense count
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    // attach expense counts
    const result = await Promise.all(
      users.map(async (u) => {
        const count = await Expense.countDocuments({ user: u._id });
        return { ...u.toJSON(), expenseCount: count };
      })
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/users/:id — single user
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/users/:id — update user (name, email, role, isActive)
router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    await user.save();
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/users/:id — delete user + their expenses + activities
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    }
    await Expense.deleteMany({ user: req.params.id });
    await UserActivity.deleteMany({ user: req.params.id });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User and all their data deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/activities — all activity logs (paginated)
router.get('/activities', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const userId = req.query.userId;
    const filter = userId ? { user: userId } : {};
    const total = await UserActivity.countDocuments(filter);
    const activities = await UserActivity.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.json({ success: true, data: activities, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/expenses/:userId — all expenses for a user
router.get('/expenses/:userId', async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.params.userId }).sort({ date: -1 });
    res.json({ success: true, data: expenses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/invite — generate a one-time admin invite token
router.post('/invite', async (req, res) => {
  try {
    const invite = await AdminInvite.create({ createdBy: req.user._id });
    await UserActivity.create({
      user: req.user._id,
      action: 'generate_invite',
      detail: `Admin invite token generated: ${invite.token.substring(0, 8)}...`
    });
    res.json({
      success: true,
      data: {
        token: invite.token,
        expiresAt: invite.expiresAt
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/invites — list all invite tokens
router.get('/invites', async (req, res) => {
  try {
    const invites = await AdminInvite.find()
      .populate('createdBy', 'name email')
      .populate('usedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, data: invites });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/invites/:id — revoke an invite token
router.delete('/invites/:id', async (req, res) => {
  try {
    await AdminInvite.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Invite token revoked' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/reset-database — wipe ALL data (requires confirmation phrase)
router.post('/reset-database', async (req, res) => {
  try {
    const { confirmation } = req.body;
    if (confirmation !== 'RESET EVERYTHING') {
      return res.status(400).json({ success: false, message: 'Invalid confirmation phrase' });
    }
    await Expense.deleteMany({});
    await UserActivity.deleteMany({});
    await AdminInvite.deleteMany({});
    await User.deleteMany({});
    // Note: response sent before session ends naturally since token is now invalid
    res.json({ success: true, message: 'Database wiped. All users, expenses, and activity logs deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
