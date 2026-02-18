const database = require('../config/database');

const getDb = () => {
  if (!database.db) {
    throw Object.assign(new Error('Database not initialized'), { status: 500 });
  }

  return database.db;
};

const run = (sql, params = []) => new Promise((resolve, reject) => {
  getDb().run(sql, params, function onRun(err) {
    if (err) {
      reject(err);
    } else {
      resolve(this);
    }
  });
});

const get = (sql, params = []) => new Promise((resolve, reject) => {
  getDb().get(sql, params, (err, row) => {
    if (err) {
      reject(err);
    } else {
      resolve(row);
    }
  });
});

const all = (sql, params = []) => new Promise((resolve, reject) => {
  getDb().all(sql, params, (err, rows) => {
    if (err) {
      reject(err);
    } else {
      resolve(rows);
    }
  });
});

module.exports = {
  getDb,
  run,
  get,
  all
};
