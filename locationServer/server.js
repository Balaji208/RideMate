const express = require('express');
const { redisClient } = require('./config/redis');
const { logger } = require('./config/logger');
const captainRoutes = require('./routes/captain');
const riderRoutes = require('./routes/rider');
const healthRoutes = require('./routes/health');
const { matchingQueue } = require('./services/matching');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');

logger.info('Starting server setup');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: 'http://localhost:5173' } });
const port = 3002;

app.use(cors());
app.use(express.json());

logger.info('Mounting routes');
app.use('/location/captain', captainRoutes);
app.use('/location/rider', riderRoutes);
app.use('/ride', riderRoutes);
app.use('/captains', captainRoutes);
app.use('/', healthRoutes);

app.use((req, res) => {
  res.status(404).send('Not Found');
});

io.on('connection', (socket) => {
  logger.info('WebSocket client connected');
  socket.on('captainLocation', async (data) => {
    try {
      await axios.post('http://localhost:3002/location/captain', data);
      io.emit('locationUpdate', {
        driverId: data.DRIVER_ID,
        currentLocation: { coordinates: [data.long, data.lat] },
      });
      logger.info('Captain location updated', { driverId: data.DRIVER_ID });
    } catch (err) {
      logger.error('Captain location error', { error: err.message });
    }
  });
  socket.on('userLocation', async (data) => {
    try {
      await axios.post('http://localhost:3002/location/rider', data);
      logger.info('Rider location updated', { riderId: data.riderId });
    } catch (err) {
      logger.error('Rider location error', { error: err.message });
    }
  });
  socket.on('rideRequest', async (data) => {
    try {
      const response = await axios.post('http://localhost:3002/ride/request', data);
      logger.info('Ride request sent', { riderId: data.riderId, requestId: response.data.requestId });
    } catch (err) {
      logger.error('Ride request error', { error: err.message });
    }
  });
});

server.listen(port, () => {
  logger.info(`Location Server on :${port}`);
});

redisClient.on('connect', () => {
  logger.info('Redis Connected');
});

redisClient.on('error', (err) => {
  logger.error('Redis Connection Error', { error: err.message });
});

process.on('SIGINT', async () => {
  logger.info('Shutting down server');
  await redisClient.quit();
  await matchingQueue.close();
  process.exit(0);
});