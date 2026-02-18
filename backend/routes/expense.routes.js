const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const { all, get, run } = require('../utils/db');

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
};

const expenseValidation = [
  body('amount').isFloat({ gt: 0 }).toFloat(),
  body('description').optional().trim().isLength({ max: 255 }),
  body('date').isISO8601(),
  body('type').isIn(['income', 'expense']),
  body('categoryId').optional().isInt({ min: 1 })
];

const buildFilters = (queryParams) => {
  const conditions = ['expenses.user_id = ?'];
  const values = [queryParams.userId];

  if (queryParams.startDate) {
    conditions.push('expenses.date >= ?');
    values.push(queryParams.startDate);
  }

  if (queryParams.endDate) {
    conditions.push('expenses.date <= ?');
    values.push(queryParams.endDate);
  }

  if (queryParams.type) {
    conditions.push('expenses.type = ?');
    values.push(queryParams.type);
  }

  if (queryParams.categoryId) {
    conditions.push('expenses.category_id = ?');
    values.push(queryParams.categoryId);
  }

  return { conditions, values };
};

router.get(
  '/',
  authenticate,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('type').optional().isIn(['income', 'expense']),
    query('categoryId').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const limit = req.query.limit ?? 50;
      const offset = req.query.offset ?? 0;
      const { conditions, values } = buildFilters({
        userId: req.user.id,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        type: req.query.type,
        categoryId: req.query.categoryId
      });

      const sql = `
        SELECT
          expenses.id,
          expenses.user_id AS userId,
          expenses.category_id AS categoryId,
          expenses.amount,
          expenses.description,
          expenses.date,
          expenses.type,
          expenses.created_at AS createdAt,
          expenses.updated_at AS updatedAt,
          categories.name AS categoryName,
          categories.color AS categoryColor
        FROM expenses
        LEFT JOIN categories ON categories.id = expenses.category_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY expenses.date DESC, expenses.id DESC
        LIMIT ? OFFSET ?;
      `;

      const expenses = await all(sql, [...values, limit, offset]);
      return res.json({ data: expenses, limit, offset });
    } catch (error) {
      return next(error);
    }
  }
);

router.get(
  '/summary/monthly',
  authenticate,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { conditions, values } = buildFilters({
        userId: req.user.id,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      });

      const sql = `
        SELECT
          strftime('%Y-%m', expenses.date) AS month,
          SUM(CASE WHEN expenses.type = 'income' THEN expenses.amount ELSE 0 END) AS income,
          SUM(CASE WHEN expenses.type = 'expense' THEN expenses.amount ELSE 0 END) AS expense,
          SUM(CASE WHEN expenses.type = 'income' THEN expenses.amount ELSE -expenses.amount END) AS net
        FROM expenses
        WHERE ${conditions.join(' AND ')}
        GROUP BY month
        ORDER BY month DESC;
      `;

      const summary = await all(sql, values);
      return res.json({ data: summary });
    } catch (error) {
      return next(error);
    }
  }
);

router.get(
  '/:id',
  authenticate,
  [param('id').isInt({ min: 1 })],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const expense = await get(
        `
          SELECT
            expenses.id,
            expenses.user_id AS userId,
            expenses.category_id AS categoryId,
            expenses.amount,
            expenses.description,
            expenses.date,
            expenses.type,
            expenses.created_at AS createdAt,
            expenses.updated_at AS updatedAt,
            categories.name AS categoryName,
            categories.color AS categoryColor
          FROM expenses
          LEFT JOIN categories ON categories.id = expenses.category_id
          WHERE expenses.id = ? AND expenses.user_id = ?;
        `,
        [req.params.id, req.user.id]
      );

      if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
      }

      return res.json({ data: expense });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  '/',
  authenticate,
  expenseValidation,
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { amount, description, date, type, categoryId } = req.body;

      if (categoryId) {
        const category = await get(
          'SELECT id FROM categories WHERE id = ? AND user_id = ?;',
          [categoryId, req.user.id]
        );
        if (!category) {
          return res.status(400).json({ message: 'Invalid category' });
        }
      }

      const result = await run(
        `
          INSERT INTO expenses (user_id, category_id, amount, description, date, type)
          VALUES (?, ?, ?, ?, ?, ?);
        `,
        [req.user.id, categoryId ?? null, amount, description ?? null, date, type]
      );

      const created = await get(
        'SELECT id, user_id AS userId, category_id AS categoryId, amount, description, date, type, created_at AS createdAt, updated_at AS updatedAt FROM expenses WHERE id = ?;',
        [result.lastID]
      );

      return res.status(201).json({ data: created });
    } catch (error) {
      return next(error);
    }
  }
);

router.put(
  '/:id',
  authenticate,
  [param('id').isInt({ min: 1 }), ...expenseValidation],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const existing = await get(
        'SELECT id FROM expenses WHERE id = ? AND user_id = ?;',
        [req.params.id, req.user.id]
      );

      if (!existing) {
        return res.status(404).json({ message: 'Expense not found' });
      }

      const { amount, description, date, type, categoryId } = req.body;

      if (categoryId) {
        const category = await get(
          'SELECT id FROM categories WHERE id = ? AND user_id = ?;',
          [categoryId, req.user.id]
        );
        if (!category) {
          return res.status(400).json({ message: 'Invalid category' });
        }
      }

      await run(
        `
          UPDATE expenses
          SET category_id = ?, amount = ?, description = ?, date = ?, type = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND user_id = ?;
        `,
        [categoryId ?? null, amount, description ?? null, date, type, req.params.id, req.user.id]
      );

      const updated = await get(
        'SELECT id, user_id AS userId, category_id AS categoryId, amount, description, date, type, created_at AS createdAt, updated_at AS updatedAt FROM expenses WHERE id = ?;',
        [req.params.id]
      );

      return res.json({ data: updated });
    } catch (error) {
      return next(error);
    }
  }
);

router.delete(
  '/:id',
  authenticate,
  [param('id').isInt({ min: 1 })],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const existing = await get(
        'SELECT id FROM expenses WHERE id = ? AND user_id = ?;',
        [req.params.id, req.user.id]
      );

      if (!existing) {
        return res.status(404).json({ message: 'Expense not found' });
      }

      await run('DELETE FROM expenses WHERE id = ? AND user_id = ?;', [req.params.id, req.user.id]);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
