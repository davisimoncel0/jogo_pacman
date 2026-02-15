const { MongoClient } = require('mongodb');

// Ensure MONGODB_URI is available
const uri = process.env.MONGODB_URI;
let client;

async function getClient() {
  if (!client) {
    if (!uri) throw new Error("Missing MONGODB_URI");
    client = new MongoClient(uri);
    await client.connect();
  }
  return client;
}

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const client = await getClient();
    const db = client.db('pacman');
    const collection = db.collection('ranking');

    // Extrair o path da requisição para roteamento interno
    // No Netlify, o path vem em event.path (ou processar via redirects)
    const path = event.path.replace(/\/\.netlify\/functions\/api/, '').replace(/^\/api/, '');

    // Rota GET /api/test (Diagnóstico)
    if (event.httpMethod === 'GET' && (path === '/test' || path === '/test/')) {
      const startTime = Date.now();
      await collection.countDocuments(); // Ping test
      const latency = Date.now() - startTime;

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          status: 'ok',
          environment: 'Netlify Functions',
          database: 'MongoDB Atlas',
          latency: `${latency}ms`,
          collection: 'ranking',
          timestamp: new Date().toISOString()
        })
      };
    }

    // Rota GET /api/rankings
    if (event.httpMethod === 'GET' && (path === '/rankings' || path === '/rankings/')) {
      const rankings = await collection
        .find({})
        .sort({ score: -1 })
        .limit(10)
        .toArray();
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(rankings)
      };
    }

    // Rota POST /api/rankings
    if (event.httpMethod === 'POST' && (path === '/rankings' || path === '/rankings/')) {
      const data = JSON.parse(event.body);
      const { name, score, level } = data;

      if (!name || score === undefined || level === undefined) {
        return { 
          statusCode: 400, 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: "Missing fields" }) 
        };
      }

      const normalizedName = name.trim().toUpperCase();
      const filter = { name: normalizedName };
      const update = {
        $max: { score: Number(score), level: Number(level) },
        $set: { date: new Date().toISOString() },
        $setOnInsert: { name: normalizedName }
      };
      const options = { upsert: true };

      await collection.updateOne(filter, update, options);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true })
      };
    }

    return { 
      statusCode: 404, 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: "Endpoint not found", path: path }) 
    };

  } catch (error) {
    console.error("API error:", error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: "Internal Server Error", details: error.message })
    };
  }
};
