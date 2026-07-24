const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'haya_modesty_default_secret_key';

function getAuthUser(req) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        const token = authHeader.split(' ')[1];
        return jwt.verify(token, JWT_SECRET);
    } catch (e) {
        return null;
    }
}

function verifyAdmin(req) {
    const user = getAuthUser(req);
    return user && user.role === 'admin' ? user : null;
}

module.exports = { getAuthUser, verifyAdmin, JWT_SECRET };
