const fs = require('fs');
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
  dbType = 'json';
  // Use /tmp/chat_history.json on Vercel, or local chat_history.json locally
  const isVercel = process.env.VERCEL || process.env.NOW_BUILD;
  dbInstance = isVercel ? '/tmp/chat_history.json' : path.join(__dirname, '..', 'chat_history.json');
  
  // Create empty JSON file if it doesn't exist
  if (!fs.existsSync(dbInstance)) {
    try {
      fs.writeFileSync(dbInstance, JSON.stringify([]));
    } catch (err) {
      console.error('Error creating JSON file:', err);
    }
  }
}

// Unified saveMessage function (returns a promise)
function saveMessage(userId, role, message) {
  if (dbType === 'postgres') {
    return dbInstance.query(
      'INSERT INTO chat_history (user_id, role, message) VALUES ($1, $2, $3) RETURNING id',
      [userId, role, message]
    ).then(res => res.rows[0].id);
  } else {
    return new Promise((resolve) => {
      try {
        let history = [];
        if (fs.existsSync(dbInstance)) {
          const data = fs.readFileSync(dbInstance, 'utf8');
          history = JSON.parse(data || '[]');
        }
        history.push({
          user_id: userId,
          role: role,
          message: message,
          timestamp: new Date().toISOString()
        });
        fs.writeFileSync(dbInstance, JSON.stringify(history, null, 2));
        resolve(history.length);
      } catch (err) {
        console.error('Error saving to JSON file:', err);
        resolve(0);
      }
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
    return new Promise((resolve) => {
      try {
        if (!fs.existsSync(dbInstance)) {
          return resolve([]);
        }
        const data = fs.readFileSync(dbInstance, 'utf8');
        const history = JSON.parse(data || '[]');
        const userHistory = history.filter(item => item.user_id === userId);
        resolve(userHistory);
      } catch (err) {
        console.error('Error reading from JSON file:', err);
        resolve([]);
      }
    });
  }
}

module.exports = {
  saveMessage,
  getHistory
};
