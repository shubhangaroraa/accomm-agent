const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const API_KEY = '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';

const server = http.createServer((req, res) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors); res.end(); return;
  }

  // Proxy to Anthropic
  if (req.method === 'POST' && req.url === '/api/claude') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      let parsed;
      try { parsed = JSON.parse(body); } catch(e) {
        res.writeHead(400, cors); res.end(JSON.stringify({error:'Bad JSON'})); return;
      }
      const payload = JSON.stringify(parsed);
      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'messages-2023-12-15'
        }
      };
      res.writeHead(200, { ...cors, 'Content-Type': 'application/json' });
      const apiReq = https.request(options, apiRes => {
        apiRes.on('data', chunk => res.write(chunk));
        apiRes.on('end', () => res.end());
      });
      apiReq.on('error', err => res.end(JSON.stringify({error: err.message})));
      apiReq.write(payload);
      apiReq.end();
    });
    return;
  }

  // Serve index.html for all GET requests
  if (req.method === 'GET') {
    const filePath = path.join(__dirname, 'index.html');
    console.log('Serving:', filePath, 'exists:', fs.existsSync(filePath));
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error('File read error:', err);
        res.writeHead(200, { ...cors, 'Content-Type': 'text/html' });
        res.end('<h1>Server running - but index.html not found</h1><p>Path: ' + filePath + '</p><p>Dir contents: ' + fs.readdirSync(__dirname).join(', ') + '</p>');
        return;
      }
      res.writeHead(200, { ...cors, 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => console.log('Server running on port ' + PORT));
