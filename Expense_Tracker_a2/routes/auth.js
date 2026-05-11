// Author: Al Jubayer Pial (UTS; ID: 25540865)
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserActivity = require('../models/UserActivity');
const AdminInvite = require('../models/AdminInvite');
const { protect } = require('../middleware/auth');

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function getIP(req) {
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    // First user ever becomes admin automatically
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'user';
    const user = await User.create({ name, email, password, role });
    await UserActivity.create({ user: user._id, action: 'register', detail: 'Account created', ip: getIP(req) });
    const token = signToken(user._id);
    res.status(201).json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    await UserActivity.create({ user: user._id, action: 'login', detail: 'User logged in', ip: getIP(req) });
    const token = signToken(user._id);
    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', protect, async (req, res) => {
  try {
    await UserActivity.create({ user: req.user._id, action: 'logout', detail: 'User logged out', ip: getIP(req) });
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

// POST /api/auth/register-admin — register a new admin using an invite token
router.post('/register-admin', async (req, res) => {
  try {
    const { name, email, password, token } = req.body;
    if (!name || !email || !password || !token) {
      return res.status(400).json({ success: false, message: 'All fields including invite token are required' });
    }

    // Validate token
    const invite = await AdminInvite.findOne({ token });
    if (!invite) {
      return res.status(400).json({ success: false, message: 'Invalid invite token' });
    }
    if (invite.used) {
      return res.status(400).json({ success: false, message: 'This invite token has already been used' });
    }
    if (invite.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'This invite token has expired' });
    }

    // Check email not already taken
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // Create admin user
    const user = await User.create({ name, email, password, role: 'admin' });

    // Mark token as used
    invite.used = true;
    invite.usedBy = user._id;
    await invite.save();

    await UserActivity.create({
      user: user._id,
      action: 'register',
      detail: 'Admin account created via invite token',
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''
    });

    const jwtToken = signToken(user._id);
    res.status(201).json({ success: true, token: jwtToken, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
