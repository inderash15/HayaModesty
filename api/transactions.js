const { connectToDatabase } = require('../utils/mongodb');
const { verifyAdmin } = require('../utils/jwt');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const admin = verifyAdmin(req);
    if (!admin) {
        return res.status(403).json({ error: 'Admin authorization required' });
    }

    const { db } = await connectToDatabase();
    const transactionsCollection = db.collection('transactions');

    if (req.method === 'GET') {
        try {
            const transactions = await transactionsCollection.find({}).sort({ createdAt: -1 }).toArray();
            return res.status(200).json(transactions);
        } catch (e) {
            return res.status(500).json({ error: 'Failed to fetch transactions: ' + e.message });
        }
    }

    res.status(404).json({ error: 'Method not supported' });
};
