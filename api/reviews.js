const { connectToDatabase } = require('../utils/mongodb');
const { getAuthUser } = require('../utils/auth');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { db } = await connectToDatabase();
    const reviewsCollection = db.collection('reviews');
    const authUser = getAuthUser(req);

    // GET: Fetch reviews for a specific product
    if (req.method === 'GET') {
        try {
            const { productID } = req.query;
            if (!productID) {
                return res.status(400).json({ error: 'productID parameter is required' });
            }

            const reviews = await reviewsCollection.find({ productID }).sort({ createdAt: -1 }).toArray();
            return res.status(200).json(reviews);
        } catch (e) {
            return res.status(500).json({ error: 'Failed to fetch reviews: ' + e.message });
        }
    }

    // Authenticated operations below
    if (!authUser) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const bodyData = req.body || JSON.parse(req.body || '{}');

    // POST: Create Review
    if (req.method === 'POST') {
        try {
            const { productID, rating, comment } = bodyData;

            if (!productID || !rating || !comment) {
                return res.status(400).json({ error: 'productID, rating, and comment are required' });
            }

            const newReview = {
                userID: authUser.id || 'guest',
                userName: authUser.name || 'Anonymous User',
                productID,
                rating: parseInt(rating),
                comment,
                createdAt: new Date()
            };

            await reviewsCollection.insertOne(newReview);
            return res.status(201).json({ success: true, message: 'Review added successfully' });
        } catch (e) {
            return res.status(500).json({ error: 'Failed to add review: ' + e.message });
        }
    }

    // DELETE: Delete Review
    if (req.method === 'DELETE') {
        try {
            const { id } = bodyData;
            if (!id) {
                return res.status(400).json({ error: 'Review ID required' });
            }

            const review = await reviewsCollection.findOne({ _id: new ObjectId(id) });
            if (!review) {
                return res.status(404).json({ error: 'Review not found' });
            }

            // Must be the owner or an admin
            if (review.userID !== authUser.id && authUser.role !== 'admin') {
                return res.status(403).json({ error: 'Unauthorized to delete this review' });
            }

            await reviewsCollection.deleteOne({ _id: new ObjectId(id) });
            return res.status(200).json({ success: true, message: 'Review deleted successfully' });
        } catch (e) {
            return res.status(500).json({ error: 'Failed to delete review: ' + e.message });
        }
    }

    res.status(404).json({ error: 'Method not supported' });
};
