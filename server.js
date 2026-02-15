/**
 * Servidor Express do Pac-Man.
 * 
 * Responsabilidades:
 *  - Servir os arquivos estáticos do frontend (HTML, CSS, JS)
 *  - Fornecer a API REST de rankings (/api/rankings) com MongoDB
 *  - Habilitar Hot Reload via SSE para desenvolvimento local
 *  - Configurar CORS para permitir requisições cross-origin
 * 
 * Pode ser executado localmente (node server.js) ou exportado
 * para ambientes serverless como Netlify Functions.
 */
const express = require('express');
const path = require('path');
require('dotenv').config(); // Carrega variáveis de ambiente do .env

const { router: rankingRouter, getDb } = require('./routes/rankings');
const devRouter = require('./routes/dev');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

// === Middlewares Globais ===

// Parsing de JSON no body das requisições POST
app.use(express.json());

// Configuração de CORS — permite requisições de qualquer origem
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  // Responde imediatamente a requisições preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// === Rotas de API ===
// IMPORTANTE: Definir rotas de API ANTES dos arquivos estáticos para evitar conflitos de MIME type
app.use('/api/rankings', rankingRouter); // API de ranking (GET/POST)
app.use('/reload', devRouter);           // SSE para Hot Reload em desenvolvimento

// Compatibilidade com endpoint antigo (/api/test → /api/rankings/test)
app.get('/api/test', (req, res) => {
    res.redirect(301, '/api/rankings/test');
});

// === Arquivos Estáticos ===
app.use(express.static(path.join(ROOT_DIR, 'public'))); // Pasta public (CSS, JS)
app.use(express.static(ROOT_DIR));                        // Raiz (index.html)

// Fallback SPA — qualquer rota não encontrada serve o index.html
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

/**
 * Inicia o servidor Express e verifica a conexão com o MongoDB.
 * Em ambiente Netlify, o servidor é exportado como módulo sem bind de porta.
 */
async function startServer() {
  try {
    // Só testa o banco e faz bind da porta se NÃO estiver no Netlify
    if (!process.env.NETLIFY) {
      console.log('🔍 Testando conexão com o Banco de Dados...');
      const collection = await getDb();
      const count = await collection.countDocuments();
      console.log(`✅ MongoDB: OK (${count} registros)`);
      
      app.listen(PORT, () => {
        console.log(`🎮 Servidor PAC-MAN rodando em http://localhost:${PORT}`);
        console.log(`🔥 Hot Reload: Ativo para desenvolvimento local`);
      });
    }
  } catch (err) {
    if (!process.env.NETLIFY) {
      console.error('❌ ERRO NA INICIALIZAÇÃO:', err.message);
      // Mantém o servidor rodando mesmo com erro no DB
      app.listen(PORT, () => {
        console.log(`⚠️ Servidor iniciado com ERROS na porta ${PORT}`);
      });
    }
  }
}

// Exporta o app para uso em ambientes serverless (Netlify Functions)
module.exports = app;

// Executa se rodando diretamente (não importado como módulo)
if (require.main === module) {
  startServer();
}
