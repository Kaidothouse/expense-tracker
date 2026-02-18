# Expense Tracker

A premium, full-stack expense tracker with a dark SaaS-inspired UI, interactive analytics, and a SQLite-backed API. The app includes budgeting insights, category breakdowns, and a responsive experience across mobile, tablet, and desktop.

## Features

- Dashboard with monthly totals, budget progress, pie + bar charts, and recent expenses
- Expense management with filters, inline edit/delete, and interactive category breakdown
- Budgeting with progress indicators, category-level spend, and status insights
- Toast notifications for success/error actions
- Confirmation modals and graceful empty states
- Secure password hashing with bcrypt
- Production-ready static file serving and dynamic port fallback

## Tech Stack

**Frontend**
- React 18
- Tailwind CSS
- Recharts
- Axios + Axios Retry
- React Router

**Backend**
- Node.js + Express
- SQLite
- Express Validator
- Helmet, CORS, Morgan
- bcryptjs

## Project Structure

```
expense-tracker/
├── backend/                # Backend API server
│   ├── config/            # Configuration files
│   ├── db/               # SQLite database files
│   ├── middleware/       # Custom middleware
│   ├── routes/           # API routes
│   └── server.js         # Main server file
├── frontend/              # React frontend
│   ├── public/           # Static files
│   └── src/              # React source
└── package.json          # Root scripts
```

## Setup

### 1) Install dependencies

```bash
cd expense-tracker
npm run install:all
```

### 2) Configure environment

Backend:
```bash
cd backend
cp .env.example .env
```

Frontend:
```bash
cd ../frontend
cp .env.example .env
```

### 3) Seed data (optional)

```bash
cd ../backend
npm run seed
npm run sample-data
```

### 4) Start development servers

```bash
cd ..
npm run dev
```

This starts:
- Frontend: `http://localhost:3000`
- Backend: dynamic port (default `http://localhost:5001`)

## Running Tests

Backend:
```bash
cd backend
npm test
```

Frontend:
```bash
cd frontend
npm test -- --watchAll=false
```

## Production Build

```bash
cd frontend
npm run build
cd ../backend
npm start
```

In production, the backend serves the frontend from `frontend/build`.

## API Summary

Base URL (dev): `http://localhost:5001/api`

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/verify-password`
- `GET /expenses`
- `POST /expenses`
- `PUT /expenses/:id`
- `DELETE /expenses/:id`
- `GET /categories`
- `GET /budget/current`
- `PUT /budget/monthly`
- `GET /budget/trends`
- `GET /budget/recent`

## Screenshots

Add your screenshots to a `screenshots/` folder and update this section:

```
screenshots/dashboard.png
screenshots/expenses.png
screenshots/budget.png
```

## Notes

- The frontend uses `REACT_APP_API_URL` when set, otherwise defaults to `http://localhost:5001/api` in development and `/api` in production.
- Passwords are hashed with bcrypt before storage.
