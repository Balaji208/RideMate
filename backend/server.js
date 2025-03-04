const http = require('http');   // Import Node.js core module
const app = require('./app'); // Import the Express app
const port = process.env.PORT || 3001; // Set the port to either the environment port or 3000

const server = http.createServer(app); // Create an HTTP server and pass the Express app as the request/response handler


server.listen(port,()=>{
    console.log(`Server is listening on port ${port}`);
}); 