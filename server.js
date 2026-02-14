/**
 * PAC-MAN Game Server
 * Uses better-sqlite3 for rankings
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const PORT = 3000;
const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DB_FILE = path.join(__dirname, 'rankings.db');

// Initialize Database
const db = new Database(DB_FILE);

// Create table if not exists
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rankings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      score INTEGER NOT NULL,
      level INTEGER NOT NULL,
      date TEXT NOT NULL
    )
  `);
}

// MIME types for static file serving
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
};

// Send a JSON response
function sendJSON(res, statusCode, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

// Serve static files
function serveStatic(req, res) {
  let filePath;
  if (req.url === '/' || req.url === '/index.html') {
    filePath = path.join(ROOT_DIR, 'index.html');
  } else {
    // Try to find the file in public/ first, then root (for node_modules or other root files if needed)
    // But primarily we want to serve from public for assets
    filePath = path.join(PUBLIC_DIR, req.url);
    if (!fs.existsSync(filePath)) {
        filePath = path.join(ROOT_DIR, req.url);
    }
  }

  // Security: prevent directory traversal
  // Allow access if it's within ROOT_DIR, basically.
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

// SSE Clients for Hot Reload
let clients = [];

// Watch public directory for changes
fs.watch(PUBLIC_DIR, { recursive: true }, (eventType, filename) => {
  console.log(`🔄 File changed: ${filename}`);
  clients.forEach(client => client.res.write(`data: reload\n\n`));
});

// Create HTTP server
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // API: Hot Reload (SSE)
  if (req.method === 'GET' && url.pathname === '/reload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    res.write('\n');
    
    const clientId = Date.now();
    const newClient = { id: clientId, res };
    clients.push(newClient);

    req.on('close', () => {
      clients = clients.filter(c => c.id !== clientId);
    });
    return;
  }

  // API: GET rankings
  if (req.method === 'GET' && url.pathname === '/api/rankings') {
    try {
      const stmt = db.prepare('SELECT * FROM rankings ORDER BY score DESC LIMIT 10');
      const rankings = stmt.all();
      sendJSON(res, 200, rankings);
    } catch (e) {
      sendJSON(res, 500, { error: e.message });
    }
    return;
  }

  // API: POST ranking
  if (req.method === 'POST' && url.pathname === '/api/rankings') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (!data.name || data.score == null || data.level == null) {
          sendJSON(res, 400, { error: 'name, score, and level are required' });
          return;
        }

        const stmt = db.prepare(`
          INSERT INTO rankings (name, score, level, date)
          VALUES (?, ?, ?, ?)
        `);
        
        stmt.run(
          data.name.trim(),
          Number(data.score),
          Number(data.level),
          new Date().toISOString()
        );

        sendJSON(res, 200, { success: true });
      } catch (e) {
        sendJSON(res, 500, { error: e.message });
      }
    });
    return;
  }

  // Static files
  serveStatic(req, res);
});

// Start server
initDb();
server.listen(PORT, () => {
  console.log(`🎮 PAC-MAN server running at http://localhost:${PORT}`);
  console.log(`🗄️ Database: ${DB_FILE}`);
  console.log(`📂 Static files: ${PUBLIC_DIR}`);
  console.log(`🔥 Hot Reload: Active for public folder`);
  console.log('Press Ctrl+C to stop.');
});

