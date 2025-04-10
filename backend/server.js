// server.js
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app"); // Import the Express app
const {simulateDriverMovement} = require("./utils/captain/simulateLocation");

const port = process.env.PORT || 5000; // Changed to 5000 to match previous setup

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, { cors: { origin: "http://localhost:5173" } });

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
});

// Start driver simulation
simulateDriverMovement(io).catch((err) => {
  console.error("Failed to start driver simulation:", err.message);
});

// Start the server
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});