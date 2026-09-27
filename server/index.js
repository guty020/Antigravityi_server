/**
 * Antigravity Connector - Main Server
 * Express REST API + WebSocket Server + Static Frontend
 */

const express = require('express');
const http = require('node:http');
const path = require('node:path');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const { getDb } = require('./db');
const apiRouter = require('./api');
const monitoring = require('./monitoring');

const app = express();
const server = http.createServer(app);

// Initialize DB schema
const db = getDb();

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Mount REST API
app.use('/api', apiRouter);

// Direct download/serve of agent daemon script for 1-click pairing
app.get('/agent.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.resolve(__dirname, '..', 'agent-connector', 'agent.js'));
});
app.get('/api/agent/download', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.resolve(__dirname, '..', 'agent-connector', 'agent.js'));
});

// Serve static frontend files from client/
const CLIENT_DIR = path.resolve(__dirname, '..', 'client');
app.use(express.static(CLIENT_DIR));

// WebSocket server on /ws
const wss = new WebSocketServer({ server, path: '/ws' });
const connectedClients = new Set();
const connectedAgents = new Map(); // machineId -> ws

wss.on('connection', (ws, req) => {
  connectedClients.add(ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      // Agent registration on WS
      if (data.type === 'AGENT_REGISTER') {
        connectedAgents.set(data.machineId, ws);
        ws.machineId = data.machineId;
        broadcastToClients({
          type: 'AGENT_STATUS_UPDATE',
          machineId: data.machineId,
          status: 'ONLINE'
        });
      }

      // Terminal / task execution log stream from agent
      if (data.type === 'TASK_LOG_STREAM') {
        broadcastToClients({
          type: 'TASK_LOG_UPDATE',
          taskId: data.taskId,
          chunk: data.chunk
        });
      }
    } catch (err) {
      // ignore malformed message
    }
  });

  ws.on('close', () => {
    connectedClients.delete(ws);
    if (ws.machineId) {
      connectedAgents.delete(ws.machineId);
      broadcastToClients({
        type: 'AGENT_STATUS_UPDATE',
        machineId: ws.machineId,
        status: 'OFFLINE'
      });
    }
  });

  // Welcome ping
  ws.send(JSON.stringify({ type: 'CONNECTED', serverTime: new Date().toISOString() }));
});

function broadcastToClients(payload) {
  const message = JSON.stringify(payload);
  for (const client of connectedClients) {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  }
}

// Background monitoring loop (runs every 30s)
const monitoringInterval = setInterval(async () => {
  try {
    const cycle = await monitoring.runMonitoringCycle(db);
    if (cycle.newAlertsCount > 0) {
      broadcastToClients({
        type: 'NEW_ALERTS',
        alerts: cycle.alerts
      });
    }
  } catch (e) {
    // ignore
  }
}, 30000);

// Fallback to index.html for SPA routing
app.use((req, res) => {
  res.sendFile(path.join(CLIENT_DIR, 'index.html'));
});

const PORT = process.env.PORT || 4000;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  ANTIGRAVITY CONNECTOR PLATFORM`);
    console.log(`  Running on: http://localhost:${PORT}`);
    console.log(`  WebSocket on: ws://localhost:${PORT}/ws`);
    console.log(`  Database: node:sqlite (Node 24 native)`);
    console.log(`====================================================`);
  });
}

module.exports = { app, server, getDb };
