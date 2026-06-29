/* server.js - Native Node.js Static File Web Server */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.json': 'application/json',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`[Request] ${req.method} ${req.url}`);

  // Resolve requested file path
  let filePath = req.url === '/' ? './index.html' : '.' + req.url;
  
  // Strip query strings or hash parameters
  filePath = filePath.split('?')[0].split('#')[0];
  
  // Resolve absolute path
  const absolutePath = path.resolve(__dirname, filePath);

  // Prevent directory traversal attacks (ensure file is within the project directory)
  if (!absolutePath.startsWith(__dirname)) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Access Denied');
    return;
  }

  fs.stat(absolutePath, (err, stats) => {
    if (err || !stats.isFile()) {
      console.log(`[404] File not found: ${filePath}`);
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end('<h1>404 Not Found</h1><p>The requested file could not be found.</p>');
      return;
    }

    // Determine the Content-Type
    const ext = path.extname(absolutePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Set header and pipe file content
    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(absolutePath);
    stream.on('error', (streamErr) => {
      console.error('[Error] Streaming failed:', streamErr);
      res.statusCode = 500;
      res.end('Internal Server Error');
    });
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  Interactive Book Reader Server is Running!`);
  console.log(`  Local URL: http://127.0.0.1:${PORT}`);
  console.log(`====================================================`);
});
