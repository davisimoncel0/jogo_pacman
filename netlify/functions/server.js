const serverless = require('serverless-http');
const server = require('../../server');

// Bridge the Node.js server to Netlify Functions
exports.handler = serverless(server, {
  // Option to handle binary types if needed
  binary: ['image/*', 'font/*']
});
