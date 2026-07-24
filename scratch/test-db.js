const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load .env
if (fs.existsSync(path.join(__dirname, '..', '.env'))) {
    const dotenv = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
    dotenv.split('\n').forEach(line => {
        const parts = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (parts) {
            const key = parts[1];
            let value = parts[2] || '';
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1);
            }
            process.env[key] = value;
        }
    });
}

const uri = process.env.MONGODB_URI;
console.log('Using URI:', uri);

if (!uri) {
    console.error('Error: MONGODB_URI is not defined in .env');
    process.exit(1);
}

const client = new MongoClient(uri);

async function run() {
    try {
        console.log('Connecting to MongoDB Atlas...');
        await client.connect();
        console.log('Success! Connected to database:', client.db().databaseName);
    } catch (e) {
        console.error('Connection error details:', e);
    } finally {
        await client.close();
    }
}

run();
