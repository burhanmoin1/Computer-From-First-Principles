const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const isVercel = process.env.VERCEL || process.env.NOW_BUILD;
const dbPath = isVercel ? '/tmp/chat.db' : path.join(__dirname, '..', 'chat.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    db.run(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        role TEXT,
        message TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
});

module.exports = db;
