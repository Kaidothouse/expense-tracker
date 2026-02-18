const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const envDbPath = process.env.DB_PATH
        ? path.resolve(__dirname, '..', process.env.DB_PATH)
        : null;
      const dbPath = envDbPath || path.join(__dirname, '..', 'db', 'expense_tracker.db');

      if (envDbPath) {
        console.log(`Using database path from .env: ${envDbPath}`);
      }

      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          resolve(this.db);
        }
      });
    });
  }

  async initialize() {
    await this.connect();
    await this.createTables();
  }

  createTables() {
    return new Promise((resolve, reject) => {
      const sql = `
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          monthly_budget DECIMAL(10, 2) DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Categories table
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
          color TEXT,
          icon TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );

        -- Expenses table
        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          category_id INTEGER,
          amount DECIMAL(10, 2) NOT NULL,
          description TEXT,
          date DATE NOT NULL,
          type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
        CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
        CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
      `;

      this.db.exec(sql, (err) => {
        if (err) {
          console.error('Error creating tables:', err);
          reject(err);
        } else {
          const addBudgetColumn = `
            ALTER TABLE users ADD COLUMN monthly_budget DECIMAL(10, 2) DEFAULT 0;
          `;

          this.db.exec(addBudgetColumn, (alterErr) => {
            if (alterErr && !String(alterErr.message).includes('duplicate column name')) {
              console.error('Error updating users table:', alterErr);
              reject(alterErr);
              return;
            }

            console.log('Database tables created successfully');
            resolve();
          });
        }
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

module.exports = new Database();
