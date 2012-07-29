(function(){

	"use strict";

	var fs = require('fs');
	var jayson = require('jayson');
	var api = require('src/api');
	var project = require('src/project');
	var logger = require('src/logger');

	var config = fs.readFileSync(project.serverConfFile, 'utf8');
	var settings = JSON.parse(config);

	var server = jayson.server(api);

	// enables access logging
	if (settings.debug) {
		server.on('request', function(request){
			var params = request.params && request.params.length ? JSON.stringify(request.params) : '';
			logger.access.debug(request.id+' => ' + request.method + params);
		});
		server.on('response', function(request, response){
			logger.access.debug(request.id + ' <= ', response.result);
		});
	}

	exports.start = function(){
		logger.access.info('Attempting to start RPC server...');
		server.http().listen(settings.port, settings.hostname, function(){
			logger.access.info('Server started: http://' + settings.hostname + ':' + settings.port);
		});
	};

	exports.port = settings.port;

})();