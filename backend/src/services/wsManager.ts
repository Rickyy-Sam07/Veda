import { WebSocket } from 'ws';

// Set of active client connections
const clients = new Set<WebSocket>();

export const registerWSClient = (ws: WebSocket) => {
  clients.add(ws);
  console.log(`📡 WS Manager: New client registered. Total active: ${clients.size}`);

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`📡 WS Manager: Client disconnected. Total active: ${clients.size}`);
  });
};

export const broadcastToClients = (message: object) => {
  const payload = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
};

export const sendJobProgress = (assignmentId: string, step: number, totalSteps: number, log: string) => {
  broadcastToClients({
    type: 'JOB_PROGRESS',
    data: {
      assignmentId,
      step,
      totalSteps,
      log
    }
  });
};

export const notifyAssignmentUpdated = (assignmentId: string, status: string, pdfPath?: string) => {
  broadcastToClients({
    type: 'ASSIGNMENT_UPDATED',
    data: {
      assignmentId,
      status,
      pdfPath
    }
  });
};
