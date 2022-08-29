/**
 * Backend for the home automation app
 *
 */

require("dotenv").config();

const path = require('path');
const ApiServer = require('./apiserver.js');

// react client side files are served from here
const reactClientDir = path.join(__dirname, '..', 'client', 'dist');

const server = new ApiServer(reactClientDir);

const port = process.env.PORT || 3000;
console.log(`Listening on ${port}`);

server.start(port);
