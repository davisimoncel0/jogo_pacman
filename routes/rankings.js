const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');

let dbClient;

async function getDb() {
  if (!dbClient) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('Configuração ausente: MONGODB_URI não encontrada no ambiente.');
    }
    try {
        dbClient = new MongoClient(uri, { 
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000
        });
        await dbClient.connect();
    } catch (e) {
        dbClient = null;
        throw new Error('Erro de Conexão: Não foi possível conectar ao banco de dados MongoDB.');
    }
  }
  return dbClient.db('pacman').collection('ranking');
}

/**
 * @route GET /api/rankings
 * @desc Retorna o top 10 rankings
 */
router.get('/', async (req, res) => {
  try {
    const collection = await getDb();
    const rankings = await collection
      .find({})
      .sort({ score: -1 })
      .limit(10)
      .toArray();
    res.json(rankings);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * @route POST /api/rankings
 * @desc Salva ou atualiza um ranking
 */
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    if (!data.name || data.score == null || data.level == null) {
      return res.status(400).json({ error: 'name, score, and level are required' });
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

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * @route GET /api/rankings/test
 * @desc Endpoint de teste para garantir conexão com DB
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

// Exporta a função para inicializar o DB e o router
module.exports = {
    router,
    getDb
};
