var project = require('../project');
var log4js = require('log4js');

log4js.configure(project.log4jsConfFile, {
	cwd: project.rootDir
});

exports.console = log4js.getLogger();
exports.access = log4js.getLogger('[access]');
exports.error = log4js.getLogger('[error]');
