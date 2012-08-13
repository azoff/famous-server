var path = require('path');
var rootDir = exports.rootDir = path.dirname(__dirname);
var confDir = exports.confDir = path.join(rootDir, 'conf');
exports.clientConfFile = path.join(confDir, 'client.json');
exports.log4jsConfFile = path.join(confDir, 'log4js.json');
exports.serverConfFile = path.join(confDir, 'server.json');
exports.stripeConfFile = path.join(confDir, 'stripe.json');