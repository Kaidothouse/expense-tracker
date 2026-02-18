require('dotenv').config();
const database = require('../config/database');
const { get, run } = require('../utils/db');

const seed = async () => {
  await database.initialize();

  const existingUser = await get('SELECT id FROM users WHERE id = 1;');

  if (!existingUser) {
    await run(
      `
        INSERT INTO users (email, username, password_hash, monthly_budget)
        VALUES (?, ?, ?, ?);
      `,
      ['demo@expense-tracker.com', 'demo', 'password', 2000]
    );
  }

  const categories = [
    { name: 'Rent', type: 'expense', color: '#7C3AED' },
    { name: 'Food', type: 'expense', color: '#F97316' },
    { name: 'Utilities', type: 'expense', color: '#22C55E' },
    { name: 'Salary', type: 'income', color: '#38BDF8' }
  ];

  for (const category of categories) {
    const existing = await get(
      'SELECT id FROM categories WHERE user_id = ? AND name = ?;',
      [1, category.name]
    );

    if (!existing) {
      await run(
        `
          INSERT INTO categories (user_id, name, type, color)
          VALUES (?, ?, ?, ?);
        `,
        [1, category.name, category.type, category.color]
      );
    }
  }

  console.log('Seed data inserted successfully.');
  await database.close();
};

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
