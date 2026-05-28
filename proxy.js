const http = require('http');
const httpProxy = require('http-proxy');

const PORT = process.env.PORT || 10000;
const FRONTEND_URL = 'http://127.0.0.1:3000';
const BACKEND_URL = 'http://127.0.0.1:5000';

// Create proxy server
const proxy = httpProxy.createProxyServer({
  ws: true // Enable WebSocket proxying for live queues/logs
});

// Handle proxy errors gracefully (e.g. if services are booting)
proxy.on('error', (err, req, res) => {
  console.error('Proxy routing error:', err);
  if (res && res.writeHead) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('VedaAI Proxy Gateway: Service is booting up. Please refresh in a moment.');
  }
});

// Create the primary HTTP gateway server listening on Render's port
const server = http.createServer((req, res) => {
  const url = req.url || '';

  // Route API endpoints, uploads path, and socket resources to backend
  if (url.startsWith('/api') || url.startsWith('/uploads') || url.startsWith('/socket.io')) {
    proxy.web(req, res, { target: BACKEND_URL });
  } else {
    // Route page requests, assets, and Next.js UI resources to frontend
    proxy.web(req, res, { target: FRONTEND_URL });
  }
});

// Handle WebSocket upgrade proxying (critical for real-time progress logs)
server.on('upgrade', (req, socket, head) => {
  const url = req.url || '';
  console.log(`Proxy Gateway: Upgrading WebSocket connection for: ${url}`);
  
  // Forward socket connections to backend WebSocket server
  proxy.ws(req, socket, head, { target: BACKEND_URL });
});

// Start gateway server
server.listen(PORT, () => {
  console.log(`🚀 VedaAI Single-Service Gateway Proxy running on port ${PORT}`);
  console.log(`   -> Internal Frontend: ${FRONTEND_URL}`);
  console.log(`   -> Internal Backend:  ${BACKEND_URL}`);
});
