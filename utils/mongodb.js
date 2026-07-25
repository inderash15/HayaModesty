const { MongoClient } = require('mongodb');
const dns = require('dns');

if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
}

const uri = process.env.MONGODB_URI;

if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }

    try {
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db();
        cachedClient = client;
        cachedDb = db;
        return { client, db };
    } catch (error) {
        console.error('MongoDB connection failed:', error);
        throw new Error('Database connection failure: ' + error.message);
    }
}

module.exports = { connectToDatabase };
