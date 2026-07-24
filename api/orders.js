const { connectToDatabase } = require('../utils/mongodb');
const { getAuthUser, verifyAdmin } = require('../utils/auth');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    let db;
    try {
        const conn = await connectToDatabase();
        db = conn.db;
    } catch (e) {
        return res.status(500).json({ error: 'Database connection failed: ' + e.message });
    }
    const ordersCollection = db.collection('orders');
    const transactionsCollection = db.collection('transactions');

    const authUser = getAuthUser(req);

    // GET Orders (User gets their own orders, Admin gets all)
    if (req.method === 'GET') {
        if (!authUser) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        try {
            let query = {};
            if (authUser.role !== 'admin') {
                query = { userID: authUser.id };
            }

            const orders = await ordersCollection.find(query).sort({ createdAt: -1 }).toArray();
            return res.status(200).json(orders);
        } catch (e) {
            return res.status(500).json({ error: 'Failed to fetch orders: ' + e.message });
        }
    }

    // POST: Create Order & Transaction
    if (req.method === 'POST') {
        try {
            const bodyData = req.body || JSON.parse(req.body || '{}');
            const { products, price, shippingAddress, paymentMethod } = bodyData;

            if (!products || !price || !shippingAddress) {
                return res.status(400).json({ error: 'Products, total price, and shipping address are required' });
            }

            const userID = authUser ? authUser.id : 'guest';

            const newOrder = {
                userID,
                products,
                price: parseFloat(price),
                status: 'pending',
                paymentStatus: 'pending',
                shippingAddress,
                createdAt: new Date()
            };

            const orderResult = await ordersCollection.insertOne(newOrder);
            const orderID = orderResult.insertedId.toString();

            // Create transaction entry
            const newTransaction = {
                orderID,
                amount: parseFloat(price),
                paymentMethod: paymentMethod || 'WhatsApp / COD',
                status: 'pending',
                createdAt: new Date()
            };
            await transactionsCollection.insertOne(newTransaction);

            return res.status(201).json({
                success: true,
                message: 'Order created successfully',
                orderID
            });
        } catch (e) {
            return res.status(500).json({ error: 'Failed to place order: ' + e.message });
        }
    }

    // PUT: Update Order (Admin only)
    if (req.method === 'PUT') {
        const admin = verifyAdmin(req);
        if (!admin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        try {
            const bodyData = req.body || JSON.parse(req.body || '{}');
            const { id, status, paymentStatus } = bodyData;
            if (!id) {
                return res.status(400).json({ error: 'Order ID is required' });
            }

            const updateFields = {};
            if (status) updateFields.status = status;
            if (paymentStatus) updateFields.paymentStatus = paymentStatus;

            await ordersCollection.updateOne({ _id: new ObjectId(id) }, { $set: updateFields });
            return res.status(200).json({ success: true, message: 'Order updated successfully' });
        } catch (e) {
            return res.status(500).json({ error: 'Failed to update order: ' + e.message });
        }
    }

    res.status(404).json({ error: 'Method not supported' });
};
