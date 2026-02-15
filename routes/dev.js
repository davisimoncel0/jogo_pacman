/**
 * Rota de Desenvolvimento — Hot Reload via Server-Sent Events (SSE).
 * 
 * Funciona apenas em ambiente de desenvolvimento local.
 * Observa alterações nos arquivos do projeto e notifica o navegador
 * para recarregar automaticamente, melhorando a produtividade.
 * 
 * Em produção (Netlify), o endpoint retorna 204 sem efeito.
 */
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

/** Lista de clientes SSE conectados ao hot reload */
let clients = [];

/** Diretório raiz do projeto (um nível acima de /routes) */
const ROOT_DIR = path.join(__dirname, '..');

// Configura o watcher de arquivos (apenas em desenvolvimento local)
if (!process.env.NETLIFY) {
  /**
   * Observa recursivamente o diretório do projeto.
   * Quando um arquivo relevante é modificado, envia "reload" para todos
   * os clientes SSE conectados, que então recarregam a página.
   */
  fs.watch(ROOT_DIR, { recursive: true }, (eventType, filename) => {
    // Ignora arquivos que não devem disparar reload
    if (filename && (
      filename.startsWith('node_modules') || 
      filename.startsWith('.git') || 
      filename.startsWith('.netlify') ||
      filename.includes('.db') ||
      filename === '.env'
    )) return;

    console.log(`🔄 Arquivo alterado: ${filename}`);

    // Notifica todos os clientes SSE conectados
    clients.forEach(client => {
      try {
        client.res.write(`data: reload\n\n`);
      } catch (e) {
        // O cliente pode já ter desconectado — ignora silenciosamente
      }
    });
  });
}

/**
 * GET /reload
 * Endpoint SSE para Hot Reload do frontend.
 * Mantém a conexão aberta e envia eventos "reload" quando arquivos mudam.
 * Em ambiente Netlify, retorna 204 (sem conteúdo) imediatamente.
 */
router.get('/', (req, res) => {
  // Em produção (Netlify), desativa o SSE
  if (process.env.NETLIFY) {
    return res.status(204).end();
  }

  // Configura headers para Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.write('\n'); // Heartbeat inicial

  // Registra o novo cliente SSE
  const clientId = Date.now();
  const newClient = { id: clientId, res };
  clients.push(newClient);

  // Remove o cliente quando a conexão é encerrada
  req.on('close', () => {
    clients = clients.filter(c => c.id !== clientId);
  });
});

module.exports = router;
