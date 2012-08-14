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

	function _profile(callback) {
		callback(null, {
			hrtime: process.hrtime(),
			memory: process.memoryUsage()
		});
	}

	function chargesCreate(params, callback) {
		if (params.call) {
			params('Missing required parameters to create charge');
		} else {
			stripe.charges.create(params, function(a,b){
				callback(a, b);
			});
		}
	}

	function chargesList(params, callback) {
		if (params.call) {
			callback = params;
			params = {};
		}
		stripe.charges.list(params, callback);
	}

	function chargesLeapfrog(params, callback) {
		if (params.call) {
			params('Missing required parameters to create customer');
		} else {
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
	}

	function clientRebuild(callback) {
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

	function method(name, fn, expected) {
		exports[name] = function() {
			var args = Array.prototype.slice.call(arguments);
			var callback = args.pop();
			var safeArgs = args.slice(0, expected);
			var safeCallback = function(error, response){
				if (error) { logger.error.error(error); }
				callback(error ? (error.message || error) : undefined, response);
			};
			safeArgs.push(safeCallback);
			try { fn.apply(exports, safeArgs); }
			catch(e) { safeCallback(e); }
		};
	}

	function paramsFormat(params, callback) {
		callback(null, {
			name: params.description,
			amount: client.money(params.amount/100),
			currency: params.currency
		});
	}

	function paramsSanitize(params, callback) {
		params = params || {};
		callback(null, {
			description: sanitizer.sanitize(params.description || ''),
			amount: parseInt(params.amount || 0, 10),
			customer: params.customer || '',
			currency: 'usd'
		});
	}

	function paramsValidate(params, callback) {
		var requestedCharge = params.requestedCharge;
		var lastCharge = params.lastCharge.data.shift();
		if (requestedCharge.amount <= lastCharge.amount) {
			callback('charge amount of ' + requestedCharge.amount + ' is not greater than last charge amount of ' + lastCharge.amount);
		} else if (requestedCharge.description.length < 4 || requestedCharge.description.length > 64) {
			callback('charge description length must be between 4 and 64 characters');
		} else{
			callback(null, requestedCharge);
		}
	}

	// PUBLIC API
	method('_profile',           _profile,        0);
	//method('charges.create',   chargesCreate,   1);
	method('charges.leapfrog',   chargesLeapfrog, 1);
	method('client.rebuild',     clientRebuild,   0);
	//method('charges.list',     chargesList,     1);
	//method('customers.create', customersCreate, 1);

})();