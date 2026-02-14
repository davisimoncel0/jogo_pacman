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
  context.callbackWaitsForEmptyEventLoop = false; // For reuse of connection

  try {
    const client = await getClient();
    const db = client.db('pacman');
    const collection = db.collection('ranking'); // Tabela unificada

    // Handle GET /api/rankings
    if (event.httpMethod === 'GET') {
      const rankings = await collection
        .find({})
        .sort({ score: -1 })
        .limit(10)
        .toArray();
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' // Or restrict to domain
        },
        body: JSON.stringify(rankings)
      };
    }

    // Handle POST /api/rankings
    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);
      const { name, score, level } = data;

      if (!name || score === undefined || level === undefined) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing fields" }) };
      }

      // Upsert logic: Update only if new score > existing score?
      // User said: "ir evoluindo e alterando o usuario no ranking".
      // Let's check existing first or use updateOne with custom logic.
      // MongoDB updateOne/replaceOne works well.
      // But updateOne with $max is perfect for high score.
      
      const normalizedName = name.trim().toUpperCase();
      
      // Update score only if new score is higher. Update level if new level is higher (or latest?).
      // Usually keeping max(score) implies keeping max(level) attained in that run.
      // But if user plays again and gets lower score, we keep old high score.
      // So $max: { score: score, level: level } makes sense.
      // Upsert: true -> Insert if not exists.
      
      const filter = { name: normalizedName };
      const update = {
        $max: { score: Number(score), level: Number(level) },
        $set: { date: new Date().toISOString() }, // Update date of best score
        $setOnInsert: { name: normalizedName } // Ensure name is set correctly on insert
      };
      const options = { upsert: true };

      await collection.updateOne(filter, update, options);

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true })
      };
    }

    return { statusCode: 405, body: "Method Not Allowed" };

  } catch (error) {
    console.error("Database error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error", details: error.message })
    };
  }
};
