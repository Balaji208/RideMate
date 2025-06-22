const { poolingQueue, setupQueue } = require('./queueService');
const { findPoolableRiders } = require('./riderPooling');

// Initialize the queue
setupQueue();

module.exports = { poolingQueue, findPoolableRiders };