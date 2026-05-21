// Server-Sent Events for real-time ticket updates
const clients = new Map(); // userId -> response

const setupSSE = (app) => {
  app.get('/api/events', (req, res) => {
    // Simple token-based auth for SSE
    const token = req.query.token;
    if (!token) return res.status(401).end();

    const jwt = require('jsonwebtoken');
    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch {
      return res.status(401).end();
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    // Keep alive ping every 30s
    const ping = setInterval(() => {
      res.write(': ping\n\n');
    }, 30000);

    clients.set(userId, res);

    req.on('close', () => {
      clearInterval(ping);
      clients.delete(userId);
    });
  });
};

const sendEvent = (userId, eventData) => {
  const client = clients.get(userId?.toString());
  if (client) {
    client.write(`data: ${JSON.stringify(eventData)}\n\n`);
  }
};

// Broadcast to all admins
const broadcastToAdmins = async (eventData) => {
  const User = require('../models/user.model');
  const admins = await User.find({ role: 'admin' });
  admins.forEach(admin => {
    sendEvent(admin._id.toString(), eventData);
  });
};

module.exports = { setupSSE, sendEvent, broadcastToAdmins };
