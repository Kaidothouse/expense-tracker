const express = require('express');
const { body, query, validationResult } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const { get, run, all } = require('../utils/db');

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
};

// Get current month budget and spending
router.get('/current', authenticate, async (req, res, next) => {
  try {
    // Get user's monthly budget
    const budget = await get(
      'SELECT monthly_budget FROM users WHERE id = ?;',
      [req.user.id]
    );

    // Get current month's spending
    const currentDate = new Date();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];

    const spending = await get(
      `
        SELECT
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalExpense,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome
        FROM expenses
        WHERE user_id = ? AND date >= ? AND date <= ?;
      `,
      [req.user.id, firstDay, lastDay]
    );

    // Get spending by category for current month
    const categorySpending = await all(
      `
        SELECT
          c.id,
          c.name,
          c.color,
          c.icon,
          COALESCE(SUM(e.amount), 0) as amount
        FROM categories c
        LEFT JOIN expenses e ON c.id = e.category_id
          AND e.user_id = ?
          AND e.date >= ?
          AND e.date <= ?
          AND e.type = 'expense'
        WHERE c.user_id = ? AND c.type = 'expense'
        GROUP BY c.id, c.name, c.color, c.icon
        ORDER BY amount DESC;
      `,
      [req.user.id, firstDay, lastDay, req.user.id]
    );

    const monthlyBudget = budget?.monthly_budget || 0;
    const totalSpent = spending?.totalExpense || 0;
    const totalIncome = spending?.totalIncome || 0;
    const remaining = monthlyBudget - totalSpent;
    const percentUsed = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;

    return res.json({
      data: {
        monthlyBudget,
        totalSpent,
        totalIncome,
        remaining,
        percentUsed,
        categorySpending,
        month: currentDate.toISOString().substring(0, 7)
      }
    });
  } catch (error) {
    return next(error);
  }
});

// Update monthly budget
router.put(
  '/monthly',
  authenticate,
  [
    body('amount').isFloat({ min: 0 }).toFloat()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { amount } = req.body;

      await run(
        'UPDATE users SET monthly_budget = ? WHERE id = ?;',
        [amount, req.user.id]
      );

      return res.json({ data: { monthlyBudget: amount } });
    } catch (error) {
      return next(error);
    }
  }
);

// Get spending trends for last N months
router.get(
  '/trends',
  authenticate,
  [
    query('months').optional().isInt({ min: 1, max: 12 }).toInt()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const months = req.query.months || 6;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months + 1);
      startDate.setDate(1);

      const trends = await all(
        `
          SELECT
            strftime('%Y-%m', date) as month,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense,
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income
          FROM expenses
          WHERE user_id = ?
            AND date >= date(?)
            AND date <= date(?)
          GROUP BY month
          ORDER BY month ASC;
        `,
        [req.user.id, startDate.toISOString(), endDate.toISOString()]
      );

      return res.json({ data: trends });
    } catch (error) {
      return next(error);
    }
  }
);

// Get recent expenses
router.get(
  '/recent',
  authenticate,
  [
    query('limit').optional().isInt({ min: 1, max: 20 }).toInt()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const limit = req.query.limit || 5;

      const expenses = await all(
        `
          SELECT
            e.id,
            e.amount,
            e.description,
            e.date,
            e.type,
            c.name as categoryName,
            c.color as categoryColor,
            c.icon as categoryIcon
          FROM expenses e
          LEFT JOIN categories c ON e.category_id = c.id
          WHERE e.user_id = ?
          ORDER BY e.date DESC, e.created_at DESC
          LIMIT ?;
        `,
        [req.user.id, limit]
      );

      return res.json({ data: expenses });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;