const { getHistory } = require('./db');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId parameter' });
  }

  try {
    const rows = await getHistory(userId);
    return res.status(200).json({ history: rows || [] });
  } catch (error) {
    console.error('History retrieval error:', error);
    return res.status(500).json({ error: 'Failed to retrieve history' });
  }
};
