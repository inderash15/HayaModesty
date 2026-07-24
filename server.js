const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Load environment variables locally if .env file exists
if (fs.existsSync(path.join(__dirname, '.env'))) {
    const dotenv = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
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

let PORT = 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        try {
            req.body = body ? JSON.parse(body) : {};
        } catch (e) {
            req.body = body;
        }

        // Route API requests to Vercel Serverless Function files
        if (pathname.startsWith('/api/')) {
            // Get base endpoint name (e.g. /api/auth/login -> auth)
            const apiName = pathname.replace('/api/', '').split('/')[0];
            const apiPath = path.join(__dirname, 'api', `${apiName}.js`);

            if (fs.existsSync(apiPath)) {
                try {
                    // Delete require cache to allow hot reloading during development
                    delete require.cache[require.resolve(apiPath)];
                    const handler = require(apiPath);

                    // Mock Vercel response helper functions
                    res.status = (code) => {
                        res.statusCode = code;
                        return res;
                    };
                    res.json = (data) => {
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(data));
                        return res;
                    };

                    req.query = Object.fromEntries(url.searchParams);

                    // Execute function
                    handler(req, res).catch(err => {
                        console.error('API Exec Error:', err);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: err.message }));
                    });
                } catch (err) {
                    console.error('API Require/Init Error:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Serverless execution failed: ' + err.message }));
                }
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: `API route /api/${apiName} not found` }));
            }
            return;
        }

        // Serve Static Files from public folder
        let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : decodeURIComponent(pathname));
        const ext = path.extname(filePath);
        let contentType = MIME_TYPES[ext] || 'application/octet-stream';

        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
                return;
            }

            fs.readFile(filePath, (err, content) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('500 Internal Server Error');
                    return;
                }
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            });
        });
    });
});

function startServer(portToTry) {
    server.listen(portToTry, () => {
        console.log(`\n🚀 Server running at http://localhost:${portToTry}/`);
        console.log(`📡 Connected to MongoDB Atlas API endpoints`);
        console.log(`Press Ctrl+C to stop.\n`);
    });
}

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`⚠️ Port ${PORT} is in use. Trying port ${PORT + 1}...`);
        PORT++;
        startServer(PORT);
    } else {
        console.error(err);
    }
});

startServer(PORT);
