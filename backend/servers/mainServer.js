// server.js
const http = require('http');
const { Server } = require('socket.io');
const app = require('../app');
const {simulateDriverMovement} = require('../utils/captain/simulateLocation');

const port = process.env.PORT || 3001;
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: 'http://localhost:5173' } });

let captainSimulations;

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Listen for user's initial location
  socket.on('userLocation', (userLocation) => {
    console.log('Received user location:', userLocation);
    if (captainSimulations) {
      captainSimulations.forEach((sim) => clearInterval(sim)); // Stop existing simulations
    }
    simulateDriverMovement(io, userLocation)
      .then((simulations) => {
        captainSimulations = simulations;
        console.log(`Started simulations for ${simulations.size} captains`);
      })
      .catch((err) => console.error('Simulation error:', err.message));
  });

  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});