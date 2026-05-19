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
          'anthropic-version': '2023-06-01'
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

  if (req.method === 'GET') {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) { res.writeHead(500); res.end('Error loading app'); return; }
      res.writeHead(200, { ...cors, 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => console.log('Running on port ' + PORT));
