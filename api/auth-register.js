const { connectToDatabase } = require('../utils/mongodb');
const { validateEmail, sanitizeString } = require('../utils/validators');
const bcrypt = require('bcryptjs');

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

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        res.status(400).json({ error: 'Name, email, and password are required' });
        return;
    }

    if (!validateEmail(email)) {
        res.status(400).json({ error: 'Invalid email address format' });
        return;
    }

    try {
        const { db } = await connectToDatabase();
        const usersCollection = db.collection('users');

        // Check if user already exists
        const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            res.status(400).json({ error: 'Account with this email already exists' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: 'u' + Date.now(),
            name: sanitizeString(name),
            email: email.toLowerCase(),
            password: hashedPassword,
            role: 'user',
            phone: '',
            address: '',
            createdAt: new Date()
        };

        await usersCollection.insertOne(newUser);
        res.status(201).json({ success: true, message: 'User registered successfully' });
    } catch (e) {
        console.error('Registration Endpoint Error:', e);
        res.status(500).json({ error: 'Internal Server Error: ' + e.message });
    }
};
