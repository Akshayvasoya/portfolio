const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Handle saving data
  if (req.method === 'POST' && req.url === '/api/save-portfolio') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        // Save to portfolio-data.json
        fs.writeFileSync(
          path.join(__dirname, 'portfolio-data.json'),
          JSON.stringify(data, null, 2),
          'utf8'
        );
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Portfolio updated successfully!' }));
      } catch (err) {
        console.error('Error saving portfolio data:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // Serve static files
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  
  // Safe path check to prevent directory traversal
  const relative = path.relative(__dirname, filePath);
  const isSafe = relative && !relative.startsWith('..') && !path.isAbsolute(relative);
  
  if (req.url !== '/' && !isSafe) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // Fallback to index.html for single page app feeling (if they go to /edit directly, etc.)
        fs.readFile(path.join(__dirname, 'index.html'), (err, indexContent) => {
          if (err) {
            res.writeHead(500);
            res.end(`Server Error: ${err.code}`);
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(indexContent, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 Portfolio local server is running!`);
  console.log(`👉 Preview website at: http://localhost:${PORT}`);
  console.log(`👉 Edit your details at: http://localhost:${PORT}/edit.html`);
  console.log(`==================================================`);
});
