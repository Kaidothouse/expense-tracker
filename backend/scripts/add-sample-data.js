const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || './db/expense_tracker.db';
const db = new sqlite3.Database(path.resolve(__dirname, '..', dbPath));

// Sample expenses data
const sampleExpenses = [
  // Food & Dining
  { description: 'Grocery Store', amount: 150.00, categoryId: 1, type: 'expense', date: new Date('2026-02-15').toISOString() },
  { description: 'Restaurant Dinner', amount: 85.50, categoryId: 1, type: 'expense', date: new Date('2026-02-14').toISOString() },
  { description: 'Coffee Shop', amount: 25.00, categoryId: 1, type: 'expense', date: new Date('2026-02-13').toISOString() },
  { description: 'Fast Food Lunch', amount: 15.75, categoryId: 1, type: 'expense', date: new Date('2026-02-12').toISOString() },
  { description: 'Bakery', amount: 30.00, categoryId: 1, type: 'expense', date: new Date('2026-02-10').toISOString() },

  // Shopping
  { description: 'Clothing Purchase', amount: 200.00, categoryId: 2, type: 'expense', date: new Date('2026-02-08').toISOString() },
  { description: 'Electronics Store', amount: 150.00, categoryId: 2, type: 'expense', date: new Date('2026-02-07').toISOString() },
  { description: 'Online Shopping', amount: 75.50, categoryId: 2, type: 'expense', date: new Date('2026-02-05').toISOString() },

  // Entertainment
  { description: 'Movie Tickets', amount: 45.00, categoryId: 3, type: 'expense', date: new Date('2026-02-16').toISOString() },
  { description: 'Concert Tickets', amount: 120.00, categoryId: 3, type: 'expense', date: new Date('2026-02-09').toISOString() },
  { description: 'Streaming Services', amount: 35.00, categoryId: 3, type: 'expense', date: new Date('2026-02-01').toISOString() },

  // Transportation
  { description: 'Gas Station', amount: 60.00, categoryId: 4, type: 'expense', date: new Date('2026-02-17').toISOString() },
  { description: 'Uber Ride', amount: 25.00, categoryId: 4, type: 'expense', date: new Date('2026-02-15').toISOString() },
  { description: 'Parking Fee', amount: 15.00, categoryId: 4, type: 'expense', date: new Date('2026-02-11').toISOString() },
  { description: 'Car Maintenance', amount: 350.00, categoryId: 4, type: 'expense', date: new Date('2026-02-06').toISOString() },

  // Bills & Utilities
  { description: 'Electric Bill', amount: 120.00, categoryId: 5, type: 'expense', date: new Date('2026-02-01').toISOString() },
  { description: 'Internet Bill', amount: 80.00, categoryId: 5, type: 'expense', date: new Date('2026-02-01').toISOString() },
  { description: 'Water Bill', amount: 45.00, categoryId: 5, type: 'expense', date: new Date('2026-02-01').toISOString() },
  { description: 'Phone Bill', amount: 55.00, categoryId: 5, type: 'expense', date: new Date('2026-02-01').toISOString() },

  // Healthcare
  { description: 'Doctor Visit', amount: 150.00, categoryId: 6, type: 'expense', date: new Date('2026-02-04').toISOString() },
  { description: 'Pharmacy', amount: 45.50, categoryId: 6, type: 'expense', date: new Date('2026-02-04').toISOString() },

  // Other
  { description: 'Gift for Friend', amount: 50.00, categoryId: 9, type: 'expense', date: new Date('2026-02-14').toISOString() },
  { description: 'Miscellaneous', amount: 25.00, categoryId: 9, type: 'expense', date: new Date('2026-02-12').toISOString() },

  // Income
  { description: 'Monthly Salary', amount: 4500.00, categoryId: 10, type: 'income', date: new Date('2026-02-01').toISOString() },
  { description: 'Freelance Project', amount: 800.00, categoryId: 11, type: 'income', date: new Date('2026-02-10').toISOString() },
];

// Add previous month's data for trend visualization
const lastMonthExpenses = [
  { description: 'Grocery Store', amount: 180.00, categoryId: 1, type: 'expense', date: new Date('2026-01-15').toISOString() },
  { description: 'Restaurant', amount: 120.00, categoryId: 1, type: 'expense', date: new Date('2026-01-20').toISOString() },
  { description: 'Shopping Mall', amount: 300.00, categoryId: 2, type: 'expense', date: new Date('2026-01-10').toISOString() },
  { description: 'Gas Station', amount: 80.00, categoryId: 4, type: 'expense', date: new Date('2026-01-25').toISOString() },
  { description: 'Electric Bill', amount: 110.00, categoryId: 5, type: 'expense', date: new Date('2026-01-01').toISOString() },
  { description: 'Monthly Salary', amount: 4500.00, categoryId: 10, type: 'income', date: new Date('2026-01-01').toISOString() },
];

// Check if database has expenses
db.get('SELECT COUNT(*) as count FROM expenses', (err, row) => {
  if (err) {
    console.error('Error checking expenses:', err);
    db.close();
    return;
  }

  if (row.count > 0) {
    console.log('Database already has expenses. Skipping sample data addition.');
    db.close();
  } else {
    // Insert expenses
    const allExpenses = [...sampleExpenses, ...lastMonthExpenses];
    let inserted = 0;

    db.serialize(() => {
      const stmt = db.prepare(`
        INSERT INTO expenses (userId, categoryId, amount, description, date, type)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      allExpenses.forEach(expense => {
        stmt.run(1, expense.categoryId, expense.amount, expense.description, expense.date, expense.type, (err) => {
          if (err) {
            console.error('Error inserting expense:', err);
          } else {
            inserted++;
          }
        });
      });

      stmt.finalize(() => {
        // Also update the monthly budget if not set
        db.get('SELECT monthly_budget FROM users WHERE id = 1', (err, user) => {
          if (!err && (!user || !user.monthly_budget)) {
            db.run('UPDATE users SET monthly_budget = 3000 WHERE id = 1', (err) => {
              if (!err) {
                console.log('Set monthly budget to $3000');
              }
            });
          }
        });

        console.log(`Added ${inserted} sample expenses successfully!`);
        db.close();
      });
    });
  }
});