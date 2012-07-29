(function(modulw){

	"use strict";

	var project = require('src/project');
	var log4js = require('log4js');

	log4js.configure(project.log4jsConfFile, {
		cwd: project.rootDir
	});

	modulw.console = log4js.getLogger();
	modulw.access = log4js.getLogger('[access]');
	var error = modulw.error = log4js.getLogger('[error]');

	modulw.uncaughtExceptionHandler = function(ex){
		error.fatal(ex);
	};

})(exports);