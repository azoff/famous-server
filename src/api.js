(function(){

	"use strict";

	var fs = require('fs');
	var client = require('src/client');
	var sanitizer = require('sanitizer');
	var async = require('async');
	var project = require('src/project');
	var logger  = require('src/logger');
	var config = fs.readFileSync(project.stripeConfFile, 'utf8');
	var settings = JSON.parse(config);
	var stripe  = require('stripe')(settings.apiSecret);

	function _profile(params, callback) {
		callback(null, {
			hrtime: process.hrtime(),
			memory: process.memoryUsage()
		});
	}

	function chargesCreate(params, callback) {
		stripe.charges.create(params, function(a,b){
			callback(a, b);
		});
	}

	function chargesList(params, callback) {
		stripe.charges.list(params, callback);
	}

	function chargesLeapfrog(params, callback) {
		async.waterfall([
			async.apply(async.parallel, {
				requestedCharge: async.apply(paramsSanitize, params), // sanitize variables
				lastCharge: async.apply(chargesList, { count: 1 })    // and get the last charge (in parallel)
			}),
			paramsValidate,                                           // validate variables
			chargesCreate,                                            // create new charge
			paramsFormat,                                             // format the params for the template
			clientUpdate                                              // update the client site
		], callback);
	}

	function clientRebuild(params, callback) {
		async.waterfall([
			async.apply(chargesList, { count: 1 }),
			function(response, callback){ callback(null, response.data.shift()); },
			paramsFormat
		], function(error, params) {
			async.waterfall([
				async.apply(client.template, params, 'content'),
				function (content, callback) {
					async.waterfall([ // and process git hooks in parallel
						async.apply(client.template, { content: content }, 'wrapper'),
						async.apply(client.rebuild, 'index.html')
					], callback);
				}
			], function(error){
				callback(error, params);
			});
		});
	}

	function clientUpdate(params, callback) {
		async.waterfall([
			async.apply(client.template, params, 'content'),
			function (content, callback) {
				params.content = content;
				callback(null, params); // send response back
				async.waterfall([ // and process git hooks in parallel
					async.apply(client.template, { content: content }, 'wrapper'),
					async.apply(client.update, 'auto: ' + params.name, 'index.html')
				], function(error) {
					if (error) { logger.error.error(error); }
					else { logger.access.info('Client Update!', params); }
				});
			}
		], callback);
	}

	function method(name, fn) {
		exports[name] = function(params, callback) {
			var respond = function(error, response){
				response = response || {};
				if (error) {
					logger.error.error(error);
					response.error = error.message || error;
				}
				callback(response);
			};
			try { fn.call(exports, params, respond); }
			catch(e) { respond(e); }
		};
	}

	function paramsFormat(params, callback) {
		var amount = params.amount/100;
		callback(null, {
			amount: amount,
			next: amount + 0.01,
			name: params.description,
			currency: params.currency,
			money: client.money(amount)
		});
	}

	function paramsSanitize(params, callback) {
		callback(null, {
			description: sanitizer.sanitize(params.description || ''),
			amount: parseFloat(params.amount || 0),
			card: params.token || '',
			currency: 'usd'
		});
	}

	function paramsValidate(params, callback) {
		var requestedCharge = params.requestedCharge;
		var lastCharge = params.lastCharge.data.shift();
		if (requestedCharge.amount <= lastCharge.amount) {
			callback('Charge amount of ' + (requestedCharge.amount/100) +
				' is not greater than last charge amount of ' + (lastCharge.amount/100));
		} else if (requestedCharge.description.length < 4 || requestedCharge.description.length > 64) {
			callback('Charge description length must be between 4 and 64 characters');
		} else if(!params.requestedCharge.card) {
			callback('Unable to process payment at this time');
		} else {
			callback(null, requestedCharge);
		}
	}

	// PUBLIC API
	method('_profile',         _profile);
	method('charges.leapfrog', chargesLeapfrog);
	method('client.rebuild',   clientRebuild);

})();