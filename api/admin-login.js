const { connectToDatabase } = require('../utils/mongodb');
const { JWT_SECRET } = require('../utils/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
    }

    let db;
    try {
        const conn = await connectToDatabase();
        db = conn.db;
    } catch (e) {
        res.status(500).json({ error: 'Database connection failed: ' + e.message });
        return;
    }

    try {
        const usersCollection = db.collection('users');

        // Check if admin credentials match
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@hayamodesty.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'enginex@103';

        if (email.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
            // Find or Upsert admin user record
            let adminUser = await usersCollection.findOne({ email: adminEmail.toLowerCase() });
            if (!adminUser) {
                const hashedPassword = await bcrypt.hash(adminPassword, 10);
                const newAdmin = {
                    id: 'admin_root',
                    name: 'Admin',
                    email: adminEmail.toLowerCase(),
                    password: hashedPassword,
                    role: 'admin',
                    createdAt: new Date()
                };
                await usersCollection.insertOne(newAdmin);
                adminUser = newAdmin;
            }

            const token = jwt.sign({ id: adminUser.id, email: adminUser.email, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
            res.status(200).json({
                token,
                user: { id: adminUser.id, name: adminUser.name, email: adminUser.email, role: 'admin' }
            });
            return;
        }

        // Regular User login as fallback if they hit admin login by mistake
        const user = await usersCollection.findOne({ email: email.toLowerCase() });
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({
            token,
            user: { id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address, role: user.role || 'user' }
        });
    } catch (e) {
        console.error('Admin Login Endpoint Error:', e);
        res.status(500).json({ error: 'Internal Server Error: ' + e.message });
    }
};
