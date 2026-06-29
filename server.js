/* server.js - Express Server with API endpoints */
require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = 8000;

// Middleware to parse JSON bodies
app.use(express.json());

// API Routes
app.post('/api/chat', require('./api/chat.js'));
app.get('/api/history', require('./api/history.js'));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Fallback for unknown routes
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  Interactive Book Reader Server (Express) Running!`);
  console.log(`  Local URL: http://127.0.0.1:${PORT}`);
  console.log(`====================================================`);
});
