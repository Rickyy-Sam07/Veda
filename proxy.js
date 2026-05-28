const http = require('http');
const httpProxy = require('http-proxy');
const { spawn } = require('child_process');
const path = require('path');

const PORT = process.env.PORT || 10000;
const FRONTEND_PORT = 3000;
const BACKEND_PORT = 5000;

const FRONTEND_URL = `http://127.0.0.1:${FRONTEND_PORT}`;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

// Helper to spawn child processes with clean environment overrides
function startService(name, command, args, cwd, port) {
  console.log(`[Proxy Gateway] Starting ${name} in ${cwd} on port ${port}...`);
  
  // Set custom PORT environment variable for the child process to avoid port conflicts
  const childEnv = {
    ...process.env,
    PORT: String(port)
  };

  const child = spawn(command, args, {
    cwd,
    env: childEnv,
    shell: true,
    stdio: 'pipe'
  });

  child.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => console.log(`[${name}] ${line}`));
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => console.error(`[${name} ERROR] ${line}`));
  });

  child.on('close', (code) => {
    console.log(`[Proxy Gateway] ${name} process exited with code ${code}`);
    // If a service exits, terminate the main gateway process to trigger a restart
    process.exit(code || 1);
  });

  return child;
}

// Check if we are running in production vs development
const isProd = process.env.NODE_ENV === 'production';
const scriptCmd = isProd ? 'start' : 'dev';

// Boot backend and frontend services under overridden ports
const backendProcess = startService('Backend', 'npm', ['run', scriptCmd], path.join(__dirname, 'backend'), BACKEND_PORT);
const frontendProcess = startService('Frontend', 'npm', ['run', scriptCmd], path.join(__dirname, 'frontend'), FRONTEND_PORT);

// Handle process termination cleanly
process.on('SIGTERM', () => {
  console.log('[Proxy Gateway] SIGTERM received. Cleaning up child processes...');
  backendProcess.kill();
  frontendProcess.kill();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Proxy Gateway] SIGINT received. Cleaning up child processes...');
  backendProcess.kill();
  frontendProcess.kill();
  process.exit(0);
});

// Create proxy server
const proxy = httpProxy.createProxyServer({
  ws: true // Enable WebSocket proxying
});

// Handle proxy errors gracefully (e.g. if services are booting)
proxy.on('error', (err, req, res) => {
  console.error('[Proxy Gateway Router Error]:', err.message);
  if (res && res.writeHead) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('VedaAI Proxy Gateway: Service is booting up. Please refresh in a moment.');
  }
});

// Create the primary HTTP gateway server listening on Render's port
const server = http.createServer((req, res) => {
  const url = req.url || '';

  if (url.startsWith('/api') || url.startsWith('/uploads') || url.startsWith('/socket.io')) {
    proxy.web(req, res, { target: BACKEND_URL });
  } else {
    proxy.web(req, res, { target: FRONTEND_URL });
  }
});

// Handle WebSocket upgrade proxying
server.on('upgrade', (req, socket, head) => {
  const url = req.url || '';
  
  proxy.ws(req, socket, head, { target: BACKEND_URL });
});

// Start gateway server
server.listen(PORT, () => {
  console.log(`🚀 VedaAI Unified Gateway Proxy running on port ${PORT}`);
  console.log(`   -> Internal Frontend target: ${FRONTEND_URL}`);
  console.log(`   -> Internal Backend target:  ${BACKEND_URL}`);
});
