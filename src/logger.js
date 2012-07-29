(function(){

	"use strict";

	var project = require('src/project');
	var log4js = require('log4js');

	log4js.configure(project.log4jsConfFile, {
		cwd: project.rootDir
	});

	exports.console = log4js.getLogger();
	exports.access = log4js.getLogger('[access]');
	var error = exports.error = log4js.getLogger('[error]');

	exports.uncaughtExceptionHandler = function(ex){
		error.fatal(ex);
	};

})();