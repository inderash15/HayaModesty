const handler = require('../api/products.js');
const fs = require('fs');
const path = require('path');

// Load .env
if (fs.existsSync(path.join(__dirname, '..', '.env'))) {
    const dotenv = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
    dotenv.split('\n').forEach(line => {
        const parts = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (parts) {
            const key = parts[1];
            let value = parts[2] || '';
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1);
            }
            process.env[key] = value;
        }
    });
}

// Mock req and res
const req = {
    method: 'GET',
    url: '/api/products',
    headers: {},
    query: {}
};

const res = {
    statusCode: 200,
    headers: {},
    setHeader(name, value) {
        this.headers[name] = value;
    },
    status(code) {
        this.statusCode = code;
        return this;
    },
    json(data) {
        console.log('Response Status:', this.statusCode);
        console.log('Response Headers:', this.headers);
        console.log('Response Data:', JSON.stringify(data, null, 2));
    },
    end(data) {
        console.log('End called with data:', data);
    }
};

handler(req, res).catch(err => {
    console.error('Handler threw error:', err);
});
