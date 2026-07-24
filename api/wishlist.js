const { connectToDatabase } = require('../utils/mongodb');
const { getAuthUser } = require('../utils/auth');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const authUser = getAuthUser(req);
    if (!authUser) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }

    try {
        const { db } = await connectToDatabase();
        const wishlistsCollection = db.collection('wishlists');

        // GET wishlist
        if (req.method === 'GET') {
            const userWishlist = await wishlistsCollection.findOne({ userID: authUser.id });
            res.status(200).json(userWishlist ? userWishlist.items : []);
            return;
        }

        // POST / PUT: Update entire wishlist array
        if (req.method === 'POST' || req.method === 'PUT') {
            const items = Array.isArray(req.body) ? req.body : [];
            await wishlistsCollection.updateOne(
                { userID: authUser.id },
                { $set: { items, updatedAt: new Date() } },
                { upsert: true }
            );
            res.status(200).json({ success: true });
            return;
        }

        // DELETE: Clear wishlist
        if (req.method === 'DELETE') {
            await wishlistsCollection.deleteOne({ userID: authUser.id });
            res.status(200).json({ success: true });
            return;
        }

        res.status(405).json({ error: 'Method Not Allowed' });
    } catch (e) {
        console.error('Wishlist API Error:', e);
        res.status(500).json({ error: 'Internal Server Error: ' + e.message });
    }
};
