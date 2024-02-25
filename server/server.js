/**
 * Backend for the home automation app
 *
 */

require('dotenv').config();

const path = require('path');
const ApiServer = require('./apiserver.js');

// client side static files are served from here
const clientDir = path.join(__dirname, '..', 'client', 'dist');

const server = new ApiServer(clientDir);

const port = process.env.PORT || 3000;
console.log(`Listening on ${port}`);

server.start(port);
