const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Expense Tracker A2 server is running', time: new Date().toISOString() });
});

// Catch-all: serve index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/expense_tracker_a2')
  .then(async () => {
    console.log('MongoDB connected successfully');
    await seedData();
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection failed:', err.message));

async function seedData() {
  const User = require('./models/User');
  const count = await User.countDocuments();
  if (count > 0) return; // Already has users, skip seeding
  console.log('No users found. The first account you register will automatically become Admin.');
}
