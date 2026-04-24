const db = require('./db');

// Async interface backed by better-sqlite3 (synchronous).
function getLocalConnection() {
  const conn = {
    execute(sql, params = []) {
      const stmt = db.prepare(sql);
      const upper = sql.trim().toUpperCase();
      let rows;
      if (upper.startsWith('SELECT')) {
        rows = stmt.all(...params);
      } else {
        rows = stmt.run(...params);
      }
      return Promise.resolve([rows]);
    },
    release() {},
  };
  return Promise.resolve(conn);
}

module.exports = { getLocalConnection };
