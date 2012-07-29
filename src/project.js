var path = require('path');
var rootDir = exports.rootDir = path.dirname(__dirname);
var confDir = exports.confDir = path.join(rootDir, 'conf');
exports.log4jsConfFile = path.join(confDir, 'log4js.json');
exports.serverConfFile = path.join(confDir, 'server.json');