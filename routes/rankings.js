/**
 * Rota de Rankings — API REST para gerenciamento de pontuações.
 * 
 * Endpoints:
 *  GET  /api/rankings      → Retorna o top 10 rankings ordenados por pontuação
 *  POST /api/rankings      → Salva ou atualiza a pontuação de um jogador
 *  GET  /api/rankings/test → Testa a conexão com o banco de dados
 * 
 * O banco utilizado é o MongoDB Atlas, com a collection "ranking"
 * dentro do database "pacman".
 */
const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');

/** Cliente MongoDB reutilizável (singleton) */
let dbClient;

/**
 * Obtém (ou cria) a conexão com o MongoDB e retorna a collection de ranking.
 * Implementa padrão singleton — só conecta uma vez e reutiliza.
 * 
 * @returns {Promise<import('mongodb').Collection>} Collection "ranking" do DB "pacman"
 * @throws {Error} Se MONGODB_URI não estiver configurada ou conexão falhar
 */
async function getDb() {
  if (!dbClient) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('Configuração ausente: MONGODB_URI não encontrada no ambiente.');
    }
    try {
        dbClient = new MongoClient(uri, { 
            serverSelectionTimeoutMS: 5000,  // Timeout de seleção do servidor
            connectTimeoutMS: 5000           // Timeout de conexão
        });
        await dbClient.connect();
    } catch (e) {
        dbClient = null; // Reseta para permitir reconexão
        throw new Error('Erro de Conexão: Não foi possível conectar ao banco de dados MongoDB.');
    }
  }
  return dbClient.db('pacman').collection('ranking');
}

/**
 * GET /api/rankings
 * Retorna os 10 melhores jogadores ordenados por pontuação (maior primeiro).
 */
router.get('/', async (req, res) => {
  try {
    const collection = await getDb();
    const rankings = await collection
      .find({})
      .sort({ score: -1 })  // Ordem decrescente por pontuação
      .limit(10)             // Apenas top 10
      .toArray();
    res.json(rankings);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/rankings
 * Salva ou atualiza a pontuação de um jogador.
 * 
 * Comportamento de upsert:
 *  - Se o jogador já existe, atualiza APENAS se a nova pontuação/fase for MAIOR ($max)
 *  - Se não existe, cria um novo registro
 * 
 * Body esperado: { name: string, score: number, level: number }
 */
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    // Validação dos campos obrigatórios
    if (!data.name || data.score == null || data.level == null) {
      return res.status(400).json({ error: 'name, score, and level are required' });
    }

    const collection = await getDb();
    // Normaliza o nome: remove espaços nas pontas e converte para maiúsculas
    const normalizedName = data.name.trim().toUpperCase();

    await collection.updateOne(
      { name: normalizedName },
      {
        $max: { score: Number(data.score), level: Number(data.level) }, // Só sobrescreve se MAIOR
        $set: { date: new Date().toISOString() },                      // Atualiza data sempre
        $setOnInsert: { name: normalizedName }                          // Nome só no primeiro insert
      },
      { upsert: true } // Cria se não existir
    );

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/rankings/test
 * Endpoint de diagnóstico para verificar a conexão com o MongoDB.
 * Retorna status da conexão, latência e timestamp.
 */
router.get('/test', async (req, res) => {
  try {
    const startTime = Date.now();
    const collection = await getDb();
    await collection.countDocuments(); 
    const latency = Date.now() - startTime;
    
    res.json({
      status: 'ok',
      database: 'MongoDB Atlas',
      latency: `${latency}ms`,
      collection: 'ranking',
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ status: 'error', error: e.message });
  }
});

// Exporta o router e a função getDb para uso no server.js
module.exports = {
    router,
    getDb
};
