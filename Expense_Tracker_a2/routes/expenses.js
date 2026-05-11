// Author: Al Jubayer Pial (UTS; ID: 25540865)
const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const UserActivity = require('../models/UserActivity');
const { protect } = require('../middleware/auth');

// All expense routes require auth
router.use(protect);

// GET /api/expenses?search=&category=&month=&sort=
router.get('/', async (req, res) => {
  try {
    const { search, category, month, sort } = req.query;
    const filter = { user: req.user._id };

    // Live search: filter by title or description (case-insensitive)
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ title: regex }, { description: regex }];
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (month) {
      const [year, mon] = month.split('-').map(Number);
      const start = new Date(year, mon - 1, 1);
      const end = new Date(year, mon, 1);
      filter.date = { $gte: start, $lt: end };
    }

    let sortObj = { date: -1 };
    if (sort === 'amount_asc') sortObj = { amount: 1 };
    else if (sort === 'amount_desc') sortObj = { amount: -1 };
    else if (sort === 'date_asc') sortObj = { date: 1 };
    else if (sort === 'date_desc') sortObj = { date: -1 };
    else if (sort === 'title_asc') sortObj = { title: 1 };
    else if (sort === 'title_desc') sortObj = { title: -1 };

    const expenses = await Expense.find(filter).sort(sortObj);
    res.json({ success: true, data: expenses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/expenses
router.post('/', async (req, res) => {
  try {
    const { title, category, amount, date, description } = req.body;
    const expense = await Expense.create({ user: req.user._id, title, category, amount, date, description });
    await UserActivity.create({ user: req.user._id, action: 'create_expense', detail: `Added expense: ${title}` });
    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/expenses/:id
router.put('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    const { title, category, amount, date, description } = req.body;
    expense.title = title ?? expense.title;
    expense.category = category ?? expense.category;
    expense.amount = amount ?? expense.amount;
    expense.date = date ?? expense.date;
    expense.description = description ?? expense.description;
    await expense.save();
    await UserActivity.create({ user: req.user._id, action: 'update_expense', detail: `Updated expense: ${expense.title}` });
    res.json({ success: true, data: expense });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    await UserActivity.create({ user: req.user._id, action: 'delete_expense', detail: `Deleted expense: ${expense.title}` });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
