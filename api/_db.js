const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
let cachedClient = null;
let cachedDb = null;

if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

async function connectToDatabase() {
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }

    // Set connection options
    const client = new MongoClient(uri, {
        maxPoolSize: 10,
        minPoolSize: 1
    });

    await client.connect();
    const db = client.db(); // uses the db specified in connection URI

    cachedClient = client;
    cachedDb = db;
    return { client, db };
}

module.exports = { connectToDatabase };
