(function(){

	"use strict";

	var fs = require('fs');
	var express = require('express');
	var api = require('src/api');
	var project = require('src/project');
	var logger = require('src/logger');

	var config = fs.readFileSync(project.serverConfFile, 'utf8');
	var settings = JSON.parse(config);

	var server = express();

	server.get('/:method', function(req, res){
		if (settings.debug) { logger.access.debug(req.params); }
		api[req.params.method].call(api, req.params, res.json.bind(res));
	});

	exports.start = function(){
		logger.access.info('Attempting to start RPC server...');
		server.listen(settings.port, settings.hostname, function(){
			logger.access.info('Server started: http://' + settings.hostname + ':' + settings.port);
		});
	};

	exports.port = settings.port;

})();