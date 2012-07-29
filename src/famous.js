var logger = require('src/logger');
var server = require('src/server');
process.on('uncaughtException', logger.uncaughtExceptionHandler);
server.start();