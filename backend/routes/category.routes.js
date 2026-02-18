const express = require('express');
const { body, param, validationResult } = require('express-validator');
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

const categoryValidation = [
  body('name').notEmpty().trim().isLength({ max: 100 }),
  body('type').isIn(['income', 'expense']),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i),
  body('icon').optional().trim().isLength({ max: 50 })
];

router.get('/', authenticate, async (req, res, next) => {
  try {
    const categories = await all(
      `
        SELECT id, user_id AS userId, name, type, color, icon, created_at AS createdAt
        FROM categories
        WHERE user_id = ?
        ORDER BY name ASC;
      `,
      [req.user.id]
    );

    return res.json({ data: categories });
  } catch (error) {
    return next(error);
  }
});

router.get(
  '/:id',
  authenticate,
  [param('id').isInt({ min: 1 })],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const category = await get(
        `
          SELECT id, user_id AS userId, name, type, color, icon, created_at AS createdAt
          FROM categories
          WHERE id = ? AND user_id = ?;
        `,
        [req.params.id, req.user.id]
      );

      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      return res.json({ data: category });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  '/',
  authenticate,
  categoryValidation,
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { name, type, color, icon } = req.body;
      const existing = await get(
        'SELECT id FROM categories WHERE user_id = ? AND name = ? AND type = ?;',
        [req.user.id, name, type]
      );

      if (existing) {
        return res.status(409).json({ message: 'Category already exists' });
      }

      const result = await run(
        `
          INSERT INTO categories (user_id, name, type, color, icon)
          VALUES (?, ?, ?, ?, ?);
        `,
        [req.user.id, name, type, color ?? null, icon ?? null]
      );

      const created = await get(
        'SELECT id, user_id AS userId, name, type, color, icon, created_at AS createdAt FROM categories WHERE id = ?;',
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
  [param('id').isInt({ min: 1 }), ...categoryValidation],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const existing = await get(
        'SELECT id FROM categories WHERE id = ? AND user_id = ?;',
        [req.params.id, req.user.id]
      );

      if (!existing) {
        return res.status(404).json({ message: 'Category not found' });
      }

      const { name, type, color, icon } = req.body;
      const duplicate = await get(
        'SELECT id FROM categories WHERE user_id = ? AND name = ? AND type = ? AND id != ?;',
        [req.user.id, name, type, req.params.id]
      );

      if (duplicate) {
        return res.status(409).json({ message: 'Category already exists' });
      }

      await run(
        `
          UPDATE categories
          SET name = ?, type = ?, color = ?, icon = ?
          WHERE id = ? AND user_id = ?;
        `,
        [name, type, color ?? null, icon ?? null, req.params.id, req.user.id]
      );

      const updated = await get(
        'SELECT id, user_id AS userId, name, type, color, icon, created_at AS createdAt FROM categories WHERE id = ?;',
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
        'SELECT id FROM categories WHERE id = ? AND user_id = ?;',
        [req.params.id, req.user.id]
      );

      if (!existing) {
        return res.status(404).json({ message: 'Category not found' });
      }

      await run('DELETE FROM categories WHERE id = ? AND user_id = ?;', [req.params.id, req.user.id]);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
