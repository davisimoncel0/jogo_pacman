const express = require('express');
const path = require('path');
require('dotenv').config();

const { router: rankingRouter, getDb } = require('./routes/rankings');
const devRouter = require('./routes/dev');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

// Middlewares
app.use(express.json());

// CORS global
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Rotas de API
// IMPORTANTE: Definir rotas de API ANTES dos arquivos estáticos para evitar conflitos de MIME type
app.use('/api/rankings', rankingRouter);
app.use('/reload', devRouter);

// Compatibilidade com endpoint antigo (test)
app.get('/api/test', (req, res) => {
    res.redirect(301, '/api/rankings/test');
});

// Arquivos Estáticos
app.use(express.static(path.join(ROOT_DIR, 'public')));
app.use(express.static(ROOT_DIR)); // Para index.html na raiz

// Fallback para SPA (index.html)
// Usando regex literal para evitar problemas de compatibilidade com path-to-regexp
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

/**
 * Inicia o servidor e verifica o Banco de Dados
 */
async function startServer() {
  try {
    // Apenas tenta conectar e verificar se NÃO estiver no Netlify
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
      // Mantém o servidor rodando mesmo com erro no DB para o usuário ver o erro no console do browser
      app.listen(PORT, () => {
        console.log(`⚠️ Servidor iniciado com ERROS na porta ${PORT}`);
      });
    }
  }
}

// Export para Netlify/Serverless
module.exports = app;

// Executa se rodando diretamente
if (require.main === module) {
  startServer();
}


