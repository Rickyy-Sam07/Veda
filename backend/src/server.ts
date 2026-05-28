import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

import { connectDB } from './config/db.js';
import assignmentRoutes from './routes/assignment.js';
import toolkitRoutes from './routes/toolkit.js';
import { registerWSClient } from './services/wsManager.js';
import { startWorker } from './queues/worker.js';
import { isRedisConnected } from './services/queueService.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// Enable CORS for Next.js dev client
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Set up Static file serving for Compiled PDFs
const uploadsPath = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/assignments', assignmentRoutes);
app.use('/api/toolkit', toolkitRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'VedaAI Assessment Server is running.' });
});

// WebSocket Server Integration
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (ws: WebSocket) => {
  registerWSClient(ws);
  
  // Basic ping-pong or hello greeting
  ws.send(JSON.stringify({ type: 'INFO', data: { message: 'Connected to VedaAI WS Stream logs successfully.' } }));
});

// Bootstrap server dependencies
const bootstrap = async () => {
  try {
    // 1. Connect MongoDB
    await connectDB();

    // 2. Start background BullMQ worker ONLY if Redis is actually online
    // Give queueService connection tester 1 second to resolve connection state
    setTimeout(() => {
      if (isRedisConnected) {
        try {
          console.log('👷 Redis is online. Background BullMQ Worker initializing...');
          startWorker();
        } catch (err) {
          console.warn('⚠️ BullMQ Worker failed to initialize. Relying on In-Memory Queue Fallback.');
        }
      } else {
        console.log('🔌 Redis is offline. Bypassing worker socket connection to keep console clean. Operating in In-Memory Queue Mode.');
      }
    }, 1000);

    // 3. Start server
    server.listen(PORT, () => {
      console.log(`🚀 VedaAI API Server running on http://localhost:${PORT}`);
      console.log(`📡 WebSocket endpoint mounted on ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Bootstrap failure:', error);
    process.exit(1);
  }
};

bootstrap();
