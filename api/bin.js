const { connectToDatabase } = require('../utils/mongodb');
const { verifyAdmin } = require('../utils/jwt');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { db } = await connectToDatabase();
        const binCollection = db.collection('bin');

        // GET bin items
        if (req.method === 'GET') {
            const items = await binCollection.find({}).toArray();
            res.status(200).json(items);
            return;
        }

        // Must be admin for modifying actions
        const admin = verifyAdmin(req);
        if (!admin) {
            res.status(403).json({ error: 'Forbidden: Admin access required' });
            return;
        }

        // POST / PUT: Save/Restore items in bin
        if (req.method === 'POST' || req.method === 'PUT') {
            const data = req.body;
            if (Array.isArray(data)) {
                await binCollection.deleteMany({});
                if (data.length > 0) {
                    await binCollection.insertMany(data);
                }
            } else if (data && data.id) {
                await binCollection.updateOne({ id: data.id }, { $set: data }, { upsert: true });
            } else {
                res.status(400).json({ error: 'Invalid bin payload' });
                return;
            }
            res.status(200).json({ success: true });
            return;
        }

        // DELETE: Remove item from bin
        if (req.method === 'DELETE') {
            const { id } = req.body;
            if (!id) {
                res.status(400).json({ error: 'Missing bin item ID' });
                return;
            }
            await binCollection.deleteOne({ id });
            res.status(200).json({ success: true });
            return;
        }

        res.status(405).json({ error: 'Method Not Allowed' });
    } catch (e) {
        console.error('Bin API Error:', e);
        res.status(500).json({ error: 'Internal Server Error: ' + e.message });
    }
};
