const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

let clients = [];
const ROOT_DIR = path.join(__dirname, '..');

// Watch project root for changes (apenas se não estiver no Netlify)
if (!process.env.NETLIFY) {
  fs.watch(ROOT_DIR, { recursive: true }, (eventType, filename) => {
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
}

/**
 * @route GET /reload
 * @desc Endpoint SSE para Hot Reload
 */
router.get('/', (req, res) => {
  // Se for Netlify, retorna logo que não é suportado para evitar erros de MIME type/timeout
  if (process.env.NETLIFY) {
    return res.status(204).end();
  }

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
});

module.exports = router;
