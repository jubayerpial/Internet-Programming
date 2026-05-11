# Expense Tracker — Assignment 2

## Overview

This is a single-page expense tracking web application extended from Assignment 1. It adds user authentication (JWT + password hashing), role-based access control, an admin panel for user management, and user activity logging — fulfilling all three CRUD entity requirements.

**Entities with full CRUD:**
1. **User** — Registration/login with bcrypt password hashing and JWT. Admin can create, read, update, and delete users.
2. **Expense (expense_item)** — Full CRUD for each user's own expenses. Live search filters expense items in real-time as the user types.
3. **UserActivity (user_activity)** — Admin can view all login/logout/CRUD activity logs per user.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS SPA (single index.html), Chart.js |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken) + bcryptjs |

## Features

- **Registration/Login** — JWT authentication, bcrypt password hashing
- **Live Search** — real-time filtering as you type in the expense search bar
- **Admin Panel** — manage all user accounts (edit name/email/role/status, delete)
- **Activity Log** — admin views all login, logout, and CRUD events per user
- **Full CRUD** — add, view, edit, delete expenses
- **Dashboard** — summary cards, spending by category (doughnut chart), monthly trend (bar chart)
- **Filters** — by category, month, sort order
- **Dark / Light mode** toggle
- **Responsive** layout with mobile sidebar
- **SPA** — single index.html, no page reloads

## Project Structure

```
expense-tracker/
├── models/
│   ├── User.js           ← user schema with bcrypt
│   ├── Expense.js        ← expense schema (owned by user)
│   └── UserActivity.js   ← activity log schema
├── routes/
│   ├── auth.js           ← /api/auth (register, login, logout, me)
│   ├── expenses.js       ← /api/expenses (CRUD + live search)
│   └── admin.js          ← /api/admin (users + activity — admin only)
├── middleware/
│   └── auth.js           ← JWT protect + adminOnly middleware
├── public/
│   └── index.html        ← entire SPA frontend
├── data/
│   └── database.json     ← MongoDB export of sample data
├── server.js
├── package.json
├── .env
└── README.md
```

## Requirements

- Node.js (LTS) — https://nodejs.org
- MongoDB Community Edition (local)

## How to Run

### Step 1 — Start MongoDB

Mac (Homebrew):
```bash
brew services start mongodb/brew/mongodb-community
```

Windows: start MongoDB service or run `mongod`

### Step 2 — Install & start backend

```bash
cd expense-tracker
npm install
npm start
```

Server starts at: http://localhost:3000

### Step 3 — Open app

Navigate to: **http://localhost:3000**

First Registered Person from user portal will be admin. Existing admin can provide token from admin portal to create new admin account.

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login, returns JWT |
| POST | /api/auth/logout | Logout (logs activity) |
| GET | /api/auth/me | Get current user |

### Expenses (requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/expenses | List expenses (search/filter/sort) |
| POST | /api/expenses | Create expense |
| PUT | /api/expenses/:id | Update expense |
| DELETE | /api/expenses/:id | Delete expense |

**Live search:** `GET /api/expenses?search=coffee` — filters by title or description using MongoDB regex

### Admin (requires JWT + admin role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/users | All users + expense counts |
| PUT | /api/admin/users/:id | Edit user (name/email/role/status) |
| DELETE | /api/admin/users/:id | Delete user + all their data |
| GET | /api/admin/activities | All activity logs (filterable by user) |
| GET | /api/admin/expenses/:userId | All expenses for a specific user |

## Database

- Database name: `expense_tracker_a2`
- Collections: `users`, `expenses`, `useractivities`
- Sample export: `data/database.json`

## Troubleshooting

- Make sure MongoDB is running before starting the backend
- Check browser console for errors
- If port 3000 is busy, change `PORT` in `.env`
