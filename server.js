const http = require('http');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const PORT = 3000;
const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(__dirname, 'public');

// MongoDB Configuration
let dbClient;

async function getDb() {
  if (!dbClient) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('❌ MONGODB_URI não encontrado no arquivo .env ou no ambiente.');
      console.log('💡 DICA: Verifique se o arquivo .env existe na raiz do projeto e contém a chave MONGODB_URI.');
      process.exit(1);
    }
    dbClient = new MongoClient(uri);
    await dbClient.connect();
    console.log('🔌 Conexão com MongoDB estabelecida com sucesso');
  }
  return dbClient.db('pacman').collection('ranking');
}

/**
 * Verify database connectivity on startup
 */
async function verifyDatabase() {
  console.log('🔍 Testando conexão com o Banco de Dados...');
  try {
    const dbName = 'pacman';
    const collectionName = 'ranking';
    
    // getDb() handles connecting and returns the collection
    const collection = await getDb();
    const count = await collection.countDocuments();
    
    console.log(`✅ Conexão com MongoDB: OK`);
    console.log(`📂 Banco de Dados: "${dbName}" encontrado`);
    console.log(`📊 Coleção: "${collectionName}" acessível com ${count} registros`);
  } catch (err) {
    console.error('❌ FALHA CRÍTICA: Erro ao acessar o banco ou coleção.');
    console.error(`DETALHES: ${err.message}`);
    process.exit(1);
  }
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
    filePath = path.join(PUBLIC_DIR, req.url);
    if (!fs.existsSync(filePath)) {
        filePath = path.join(ROOT_DIR, req.url);
    }
  }

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

// Watch project root for changes
fs.watch(ROOT_DIR, { recursive: true }, (eventType, filename) => {
  // Ignore unnecessary directories and hidden files
  if (filename && (
    filename.startsWith('node_modules') || 
    filename.startsWith('.git') || 
    filename.startsWith('.netlify') ||
    filename.includes('.db') ||
    filename === '.env'
  )) return;

  console.log(`🔄 Arquivo alterado: ${filename}`);
  clients.forEach(client => {
    try {
      client.res.write(`data: reload\n\n`);
    } catch (e) {
      // client might be closed
    }
  });
});

// Create HTTP server
const server = http.createServer(async (req, res) => {
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

  // API: GET database test
  if (req.method === 'GET' && url.pathname === '/api/test') {
    try {
      const startTime = Date.now();
      const collection = await getDb();
      await collection.countDocuments(); // Simple ping
      const latency = Date.now() - startTime;
      
      sendJSON(res, 200, {
        status: 'ok',
        database: 'MongoDB Atlas',
        latency: `${latency}ms`,
        collection: 'ranking',
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      sendJSON(res, 500, { status: 'error', error: e.message });
    }
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
      const collection = await getDb();
      const rankings = await collection
        .find({})
        .sort({ score: -1 })
        .limit(10)
        .toArray();
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
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        if (!data.name || data.score == null || data.level == null) {
          sendJSON(res, 400, { error: 'name, score, and level are required' });
          return;
        }

        const collection = await getDb();
        const normalizedName = data.name.trim().toUpperCase();

        await collection.updateOne(
          { name: normalizedName },
          {
            $max: { score: Number(data.score), level: Number(data.level) },
            $set: { date: new Date().toISOString() },
            $setOnInsert: { name: normalizedName }
          },
          { upsert: true }
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

// Export server for serverless environments
module.exports = server;

// Start server only if not in Netlify environment
if (!process.env.NETLIFY) {
  server.listen(PORT, async () => {
    console.log(`🎮 Servidor PAC-MAN rodando em http://localhost:${PORT}`);
    console.log(`📂 Arquivos estáticos: ${PUBLIC_DIR}`);
    console.log(`🔥 Hot Reload: Ativo para todo o projeto`);
    
    await verifyDatabase();
  });
}

