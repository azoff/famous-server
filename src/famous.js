var logger = require('src/logger');
var server = require('src/server');
logger.access.debug('Attaching Error Handler...');
process.on('uncaughtException', logger.uncaughtExceptionHandler);
logger.access.debug('Starting RPC Server...');
server.start();