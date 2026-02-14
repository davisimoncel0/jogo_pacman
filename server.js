/**
 * PAC-MAN Game Server — Zero Dependencies
 * Uses only Node.js built-in modules: http, fs, path
 * Rankings stored in ranking.json
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const RANKING_FILE = path.join(__dirname, 'ranking.json');

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

// Initialize ranking file if it doesn't exist
function initRankings() {
  if (!fs.existsSync(RANKING_FILE)) {
    fs.writeFileSync(RANKING_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

// Read rankings from file
function getRankings() {
  try {
    const data = fs.readFileSync(RANKING_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save rankings to file
function saveRankings(rankings) {
  fs.writeFileSync(RANKING_FILE, JSON.stringify(rankings, null, 2), 'utf-8');
}

// Send a JSON response
function sendJSON(res, statusCode, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

// Serve static files from public/
function serveStatic(req, res) {
  let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url);
  filePath = decodeURIComponent(filePath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
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

  // API: GET rankings
  if (req.method === 'GET' && url.pathname === '/api/rankings') {
    const rankings = getRankings();
    const top10 = rankings.sort((a, b) => b.score - a.score).slice(0, 10);
    sendJSON(res, 200, top10);
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
        const rankings = getRankings();
        rankings.push({
          id: Date.now(),
          name: data.name.trim(),
          score: Number(data.score),
          level: Number(data.level),
          date: new Date().toISOString(),
        });
        saveRankings(rankings);
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
initRankings();
server.listen(PORT, () => {
  console.log(`🎮 PAC-MAN server running at http://localhost:${PORT}`);
  console.log(`📁 Rankings: ${RANKING_FILE}`);
  console.log(`📂 Static files: ${PUBLIC_DIR}`);
  console.log('Press Ctrl+C to stop.');
});
