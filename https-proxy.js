const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const options = {
  key: fs.readFileSync(path.join(__dirname, 'ssl', 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'ssl', 'cert.pem')),
};

const server = https.createServer(options, (req, res) => {
  console.log(`[Proxy] ${req.method} ${req.url} from ${req.socket.remoteAddress}`);
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
      console.log(`[Proxy Response] ${req.url} -> ${proxyRes.statusCode}`);
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => {
    console.error('[Proxy Error]:', err.message);
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

const os = require('os');

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254.') && !iface.address.startsWith('172.19.')) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const PORT = 3443;
server.listen(PORT, '0.0.0.0', () => {
  const lanIp = getLocalIp();
  console.log(`🔒 HTTPS Reverse Proxy is running on https://0.0.0.0:${PORT}`);
  console.log(`📱 iPhone Safari / Mobile access: https://${lanIp}:${PORT}/mbbank`);
});
