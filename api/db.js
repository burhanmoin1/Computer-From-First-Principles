const path = require('path');

// Determine which database driver to use
const databaseUrl = process.env.DATABASE_URL;

let dbInstance = null;
let dbType = '';

if (databaseUrl) {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false } // Required for Supabase connections
  });
  
  dbInstance = pool;
  dbType = 'postgres';

  // Initialize Postgres table
  pool.query(`
    CREATE TABLE IF NOT EXISTS chat_history (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      message TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).catch(err => console.error('Error initializing PostgreSQL table:', err));

} else {
  const sqlite3 = require('sqlite3').verbose();
  const isVercel = process.env.VERCEL || process.env.NOW_BUILD;
  const dbPath = isVercel ? '/tmp/chat.db' : path.join(__dirname, '..', 'chat.db');

  const sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening SQLite database:', err);
    } else {
      sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS chat_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          role TEXT NOT NULL,
          message TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
  });

  dbInstance = sqliteDb;
  dbType = 'sqlite';
}

// Unified saveMessage function (returns a promise)
function saveMessage(userId, role, message) {
  if (dbType === 'postgres') {
    return dbInstance.query(
      'INSERT INTO chat_history (user_id, role, message) VALUES ($1, $2, $3) RETURNING id',
      [userId, role, message]
    ).then(res => res.rows[0].id);
  } else {
    return new Promise((resolve, reject) => {
      dbInstance.run(
        'INSERT INTO chat_history (user_id, role, message) VALUES (?, ?, ?)',
        [userId, role, message],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }
}

// Unified getHistory function (returns a promise)
function getHistory(userId) {
  if (dbType === 'postgres') {
    return dbInstance.query(
      'SELECT role, message, timestamp FROM chat_history WHERE user_id = $1 ORDER BY id ASC',
      [userId]
    ).then(res => res.rows);
  } else {
    return new Promise((resolve, reject) => {
      dbInstance.all(
        'SELECT role, message, timestamp FROM chat_history WHERE user_id = ? ORDER BY id ASC',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }
}

module.exports = {
  saveMessage,
  getHistory
};
