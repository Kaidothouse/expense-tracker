const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || './db/expense_tracker.db';
const db = new sqlite3.Database(path.resolve(__dirname, '..', dbPath));

// Sample expenses data
const sampleExpenses = [
  // Food & Dining
  { description: 'Grocery Store', amount: 150.0, categoryName: 'Food', type: 'expense', date: new Date('2026-02-15').toISOString() },
  { description: 'Restaurant Dinner', amount: 85.5, categoryName: 'Food', type: 'expense', date: new Date('2026-02-14').toISOString() },
  { description: 'Coffee Shop', amount: 25.0, categoryName: 'Food', type: 'expense', date: new Date('2026-02-13').toISOString() },
  { description: 'Fast Food Lunch', amount: 15.75, categoryName: 'Food', type: 'expense', date: new Date('2026-02-12').toISOString() },
  { description: 'Bakery', amount: 30.0, categoryName: 'Food', type: 'expense', date: new Date('2026-02-10').toISOString() },

  // Shopping
  { description: 'Clothing Purchase', amount: 200.0, categoryName: 'Shopping', type: 'expense', date: new Date('2026-02-08').toISOString() },
  { description: 'Electronics Store', amount: 150.0, categoryName: 'Shopping', type: 'expense', date: new Date('2026-02-07').toISOString() },
  { description: 'Online Shopping', amount: 75.5, categoryName: 'Shopping', type: 'expense', date: new Date('2026-02-05').toISOString() },

  // Entertainment
  { description: 'Movie Tickets', amount: 45.0, categoryName: 'Entertainment', type: 'expense', date: new Date('2026-02-16').toISOString() },
  { description: 'Concert Tickets', amount: 120.0, categoryName: 'Entertainment', type: 'expense', date: new Date('2026-02-09').toISOString() },
  { description: 'Streaming Services', amount: 35.0, categoryName: 'Entertainment', type: 'expense', date: new Date('2026-02-01').toISOString() },

  // Transportation
  { description: 'Gas Station', amount: 60.0, categoryName: 'Transportation', type: 'expense', date: new Date('2026-02-17').toISOString() },
  { description: 'Uber Ride', amount: 25.0, categoryName: 'Transportation', type: 'expense', date: new Date('2026-02-15').toISOString() },
  { description: 'Parking Fee', amount: 15.0, categoryName: 'Transportation', type: 'expense', date: new Date('2026-02-11').toISOString() },
  { description: 'Car Maintenance', amount: 350.0, categoryName: 'Transportation', type: 'expense', date: new Date('2026-02-06').toISOString() },

  // Bills & Utilities
  { description: 'Electric Bill', amount: 120.0, categoryName: 'Utilities', type: 'expense', date: new Date('2026-02-01').toISOString() },
  { description: 'Internet Bill', amount: 80.0, categoryName: 'Utilities', type: 'expense', date: new Date('2026-02-01').toISOString() },
  { description: 'Water Bill', amount: 45.0, categoryName: 'Utilities', type: 'expense', date: new Date('2026-02-01').toISOString() },
  { description: 'Phone Bill', amount: 55.0, categoryName: 'Utilities', type: 'expense', date: new Date('2026-02-01').toISOString() },

  // Healthcare
  { description: 'Doctor Visit', amount: 150.0, categoryName: 'Healthcare', type: 'expense', date: new Date('2026-02-04').toISOString() },
  { description: 'Pharmacy', amount: 45.5, categoryName: 'Healthcare', type: 'expense', date: new Date('2026-02-04').toISOString() },

  // Other
  { description: 'Gift for Friend', amount: 50.0, categoryName: 'Other', type: 'expense', date: new Date('2026-02-14').toISOString() },
  { description: 'Miscellaneous', amount: 25.0, categoryName: 'Other', type: 'expense', date: new Date('2026-02-12').toISOString() },

  // Income
  { description: 'Monthly Salary', amount: 4500.0, categoryName: 'Salary', type: 'income', date: new Date('2026-02-01').toISOString() },
  { description: 'Freelance Project', amount: 800.0, categoryName: 'Freelance', type: 'income', date: new Date('2026-02-10').toISOString() },
];

// Add previous month's data for trend visualization
const lastMonthExpenses = [
  { description: 'Grocery Store', amount: 180.0, categoryName: 'Food', type: 'expense', date: new Date('2026-01-15').toISOString() },
  { description: 'Restaurant', amount: 120.0, categoryName: 'Food', type: 'expense', date: new Date('2026-01-20').toISOString() },
  { description: 'Shopping Mall', amount: 300.0, categoryName: 'Shopping', type: 'expense', date: new Date('2026-01-10').toISOString() },
  { description: 'Gas Station', amount: 80.0, categoryName: 'Transportation', type: 'expense', date: new Date('2026-01-25').toISOString() },
  { description: 'Electric Bill', amount: 110.0, categoryName: 'Utilities', type: 'expense', date: new Date('2026-01-01').toISOString() },
  { description: 'Monthly Salary', amount: 4500.0, categoryName: 'Salary', type: 'income', date: new Date('2026-01-01').toISOString() },
];

const getCategoryMap = (userId) => new Promise((resolve, reject) => {
  db.all('SELECT id, name FROM categories WHERE user_id = ?', [userId], (err, rows) => {
    if (err) {
      reject(err);
    } else {
      const map = rows.reduce((acc, row) => {
        acc[row.name] = row.id;
        return acc;
      }, {});
      resolve(map);
    }
  });
});

const getUserId = () => new Promise((resolve, reject) => {
  db.get('SELECT id FROM users ORDER BY id ASC LIMIT 1', (err, row) => {
    if (err) {
      reject(err);
    } else {
      resolve(row ? row.id : null);
    }
  });
});

const getExpenseCount = (userId) => new Promise((resolve, reject) => {
  db.get('SELECT COUNT(*) as count FROM expenses WHERE user_id = ?', [userId], (err, row) => {
    if (err) {
      reject(err);
    } else {
      resolve(row ? row.count : 0);
    }
  });
});

const updateMonthlyBudget = (userId) => new Promise((resolve, reject) => {
  db.get('SELECT monthly_budget FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      reject(err);
      return;
    }
    if (!user || !user.monthly_budget) {
      db.run('UPDATE users SET monthly_budget = 3000 WHERE id = ?', [userId], (updateErr) => {
        if (updateErr) {
          reject(updateErr);
        } else {
          console.log('Set monthly budget to $3000');
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
});

const insertExpenses = (userId, categoryMap, expenses) => new Promise((resolve, reject) => {
  let inserted = 0;
  const stmt = db.prepare(`
    INSERT INTO expenses (user_id, category_id, amount, description, date, type)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  expenses.forEach((expense) => {
    const categoryId = categoryMap[expense.categoryName] || null;
    stmt.run(userId, categoryId, expense.amount, expense.description, expense.date, expense.type, (err) => {
      if (err) {
        console.error('Error inserting expense:', err);
      } else {
        inserted += 1;
      }
    });
  });

  stmt.finalize((err) => {
    if (err) {
      reject(err);
    } else {
      resolve(inserted);
    }
  });
});

const runSeed = async () => {
  try {
    const userId = await getUserId();
    if (!userId) {
      console.log('No users found. Run the seed script first.');
      db.close();
      return;
    }

    const count = await getExpenseCount(userId);
    if (count > 0) {
      console.log('Database already has expenses. Skipping sample data addition.');
      db.close();
      return;
    }

    const categoryMap = await getCategoryMap(userId);
    const allExpenses = [...sampleExpenses, ...lastMonthExpenses];
    const inserted = await insertExpenses(userId, categoryMap, allExpenses);
    await updateMonthlyBudget(userId);
    console.log(`Added ${inserted} sample expenses successfully!`);
    db.close();
  } catch (error) {
    console.error('Error adding sample data:', error);
    db.close();
  }
};

runSeed();
