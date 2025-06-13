const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const Redis = require('ioredis');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:5174', // Driver app URL
    methods: ['GET', 'POST'],
  },
});

const redisPub = new Redis({ host: 'localhost', port: 6379 });
const redisSub = new Redis({ host: 'localhost', port: 6379 });

// Handle Redis connection errors
redisPub.on('error', (err) => {
  console.error('Redis publisher error', { error: err.message });
});
redisSub.on('error', (err) => {
  console.error('Redis subscriber error', { error: err.message });
});

io.on('connection', (socket) => {
  const driverId = socket.handshake.query.driverId;
  if (!driverId) {
    socket.emit('error', 'Driver ID required');
    socket.disconnect();
    console.warn('Driver connection rejected: No driverId');
    return;
  }

  console.log(`Driver connected: ${driverId}`);

  // Subscribe to Redis notifications channel
  redisSub.subscribe(`notifications:${driverId}`, (err) => {
    if (err) {
      console.error(`Error subscribing to notifications:${driverId}`, { error: err.message });
      socket.emit('error', 'Subscription failed');
    } else {
      console.log(`Subscribed to notifications:${driverId}`);
    }
  });

  // Forward Redis messages to driver
  redisSub.on('message', (channel, message) => {
    if (channel === `notifications:${driverId}`) {
      socket.emit('notification', message);
      
      console.log(`Forwarded notification to ${driverId}: ${message}`);
    }
  });

  // Handle driver responses
  socket.on('response', (data) => {
    const { requestId, accepted } = data;
    if (!requestId || typeof accepted !== 'boolean') {
      socket.emit('error', 'Invalid response');
      console.warn('Invalid response from driver', { driverId, data });
      return;
    }
    redisPub.publish(`responses:${driverId}`, JSON.stringify({ requestId, accepted }));
    console.log(`Published response for ${driverId}:`, { requestId, accepted });
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    redisSub.unsubscribe(`notifications:${driverId}`, (err) => {
      if (err) {
        console.error(`Error unsubscribing from notifications:${driverId}`, { error: err.message });
      }
    });
    console.log(`Driver disconnected: ${driverId}`);
  });
});

server.listen(3003, () => {
  console.log('WebSocket server running on http://localhost:3003');
});