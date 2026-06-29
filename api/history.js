const db = require('./db');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId parameter' });
  }

  try {
    db.all(
      'SELECT role, message, timestamp FROM chat_history WHERE user_id = ? ORDER BY id ASC',
      [userId],
      (err, rows) => {
        if (err) {
          console.error('Database read error:', err);
          return res.status(500).json({ error: 'Failed to retrieve history' });
        }
        return res.status(200).json({ history: rows || [] });
      }
    );
  } catch (error) {
    console.error('History retrieval error:', error);
    return res.status(500).json({ error: 'Failed to retrieve history' });
  }
};
