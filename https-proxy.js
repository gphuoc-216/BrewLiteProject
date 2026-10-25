const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const options = {
  key: fs.readFileSync(path.join(__dirname, 'ssl', 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'ssl', 'cert.pem')),
};

const server = https.createServer(options, (req, res) => {
  const isApi = req.url.startsWith('/api');
  const targetPort = isApi ? 3001 : 3000;

  const headers = { ...req.headers };
  headers['x-forwarded-proto'] = 'https';
  headers['x-forwarded-for'] = req.socket.remoteAddress || '';

  const proxyReq = http.request(
    {
      hostname: '127.0.0.1',
      port: targetPort,
      path: req.url,
      method: req.method,
      headers: headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('502 Bad Gateway: ' + err.message);
    }
  });

  req.pipe(proxyReq);
});

server.on('upgrade', (req, socket, head) => {
  const isApi = req.url.startsWith('/api');
  const targetPort = isApi ? 3001 : 3000;

  const proxyReq = http.request({
    hostname: '127.0.0.1',
    port: targetPort,
    path: req.url,
    method: req.method,
    headers: req.headers,
  });

  proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
    socket.write(
      `HTTP/1.1 101 Switching Protocols\r\n` +
        Object.keys(proxyRes.headers)
          .map((h) => `${h}: ${proxyRes.headers[h]}\r\n`)
          .join('') +
        '\r\n'
    );
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });

  proxyReq.on('error', () => {
    socket.destroy();
  });

  proxyReq.end();
});

const PORT = 3443;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🔒 HTTPS Reverse Proxy is running on https://0.0.0.0:${PORT}`);
  console.log(`📱 iPhone Safari access: https://192.168.1.149:${PORT}/mbbank`);
});
