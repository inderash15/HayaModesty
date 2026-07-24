const { connectToDatabase } = require('../utils/mongodb');
const { getAuthUser, verifyAdmin } = require('../utils/jwt');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // POST: Support user creation/registration directly if required
    if (req.method === 'POST') {
        try {
            const registerHandler = require('./auth/register');
            return registerHandler(req, res);
        } catch (e) {
            return res.status(500).json({ error: 'Failed to create user: ' + e.message });
        }
    }

    const authUser = getAuthUser(req);
    if (!authUser) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    // GET: Admin gets all users, User gets their profile
    if (req.method === 'GET') {
        try {
            if (authUser.role === 'admin') {
                const users = await usersCollection.find({}).sort({ createdAt: -1 }).toArray();
                const sanitized = users.map(u => ({
                    id: u.id || u._id.toString(),
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    phone: u.phone,
                    address: u.address,
                    createdAt: u.createdAt
                }));
                return res.status(200).json(sanitized);
            } else {
                let query = { id: authUser.id };
                if (ObjectId.isValid(authUser.id)) {
                    query = { $or: [{ _id: new ObjectId(authUser.id) }, { id: authUser.id }] };
                }
                const user = await usersCollection.findOne(query);
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }
                return res.status(200).json({
                    id: user.id || user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone,
                    address: user.address,
                    createdAt: user.createdAt
                });
            }
        } catch (e) {
            return res.status(500).json({ error: 'Failed to fetch user data: ' + e.message });
        }
    }

    // PUT: Update Profile
    if (req.method === 'PUT') {
        try {
            const bodyData = req.body || JSON.parse(req.body || '{}');
            const { name, phone, address } = bodyData;

            if (!name) {
                return res.status(400).json({ error: 'Name is required' });
            }

            const updateFields = {
                name,
                phone: phone || '',
                address: address || ''
            };

            let query = { id: authUser.id };
            if (ObjectId.isValid(authUser.id)) {
                query = { $or: [{ _id: new ObjectId(authUser.id) }, { id: authUser.id }] };
            }

            await usersCollection.updateOne(
                query,
                { $set: updateFields }
            );

            return res.status(200).json({ success: true, message: 'Profile updated successfully' });
        } catch (e) {
            return res.status(500).json({ error: 'Failed to update profile: ' + e.message });
        }
    }

    res.status(404).json({ error: 'Method not supported' });
};
