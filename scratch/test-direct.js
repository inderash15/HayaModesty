const { MongoClient } = require('mongodb');
const uri = 'mongodb://inderashaiworkspace_db_user:fPZJ6C3DeezVr4n4@ac-zqawfjw-shard-00-00.fw4opds.mongodb.net:27017,ac-zqawfjw-shard-00-01.fw4opds.mongodb.net:27017,ac-zqawfjw-shard-00-02.fw4opds.mongodb.net:27017/hayamodesty?ssl=true&authSource=admin&retryWrites=true&w=majority';
const client = new MongoClient(uri);
async function run() {
    try {
        console.log('Connecting directly...');
        await client.connect();
        console.log('Success! Connected to:', client.db().databaseName);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.close();
    }
}
run();
