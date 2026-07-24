const { connectToDatabase } = require('./_db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'haya_modesty_default_secret_key';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@hayamodesty.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'enginex@103';

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Parse path to route
    const urlParts = req.url.split('?')[0].split('/');
    const action = urlParts[urlParts.length - 1]; // e.g. login, register, me

    if (req.method === 'POST' && action === 'register') {
        try {
            const { name, email, password, phone, address } = req.body || JSON.parse(req.body || '{}');

            if (!name || !email || !password) {
                return res.status(400).json({ error: 'Name, email, and password are required' });
            }

            // Check if user already exists
            const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(400).json({ error: 'User already exists with this email' });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create user
            const newUser = {
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                role: 'user',
                phone: phone || '',
                address: address || '',
                createdAt: new Date()
            };

            await usersCollection.insertOne(newUser);
            return res.status(201).json({ success: true, message: 'User registered successfully' });
        } catch (e) {
            return res.status(500).json({ error: 'Registration failed: ' + e.message });
        }
    }

    if (req.method === 'POST' && (action === 'login' || action === 'admin-login')) {
        try {
            const { email, password } = req.body || JSON.parse(req.body || '{}');

            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }

            // Check if it's the Admin Login credentials
            if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
                const token = jwt.sign(
                    { email: ADMIN_EMAIL, role: 'admin', name: 'Administrator' },
                    JWT_SECRET,
                    { expiresIn: '7d' }
                );
                return res.status(200).json({
                    success: true,
                    token,
                    user: { name: 'Administrator', email: ADMIN_EMAIL, role: 'admin' }
                });
            }

            // Otherwise, normal user login
            const user = await usersCollection.findOne({ email: email.toLowerCase() });
            if (!user) {
                return res.status(400).json({ error: 'Invalid email or password' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: 'Invalid email or password' });
            }

            // Generate JWT
            const token = jwt.sign(
                { id: user._id.toString(), email: user.email, role: user.role || 'user', name: user.name },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            return res.status(200).json({
                success: true,
                token,
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role || 'user',
                    phone: user.phone,
                    address: user.address
                }
            });
        } catch (e) {
            return res.status(500).json({ error: 'Login failed: ' + e.message });
        }
    }

    res.status(404).json({ error: 'Endpoint not found' });
};
