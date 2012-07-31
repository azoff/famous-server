(function(){

	"use strict";

	var fs = require('fs');
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
				logger.console.debug(a, b);
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

	function customersCreate(params, callback) {
		if (params.call) {
			params('Missing required parameters to create customer');
		} else {
			stripe.customers.create(params, callback);
		}
	}

	function chargesLeapfrog(params, callback) {
		if (params.call) {
			params('Missing required parameters to create customer');
		} else {
			async.waterfall([
				// get the most recent charge
				function(callback){
					chargesList({ count: 1 }, callback);
				},
				// check to see if the current charge beats the last
				function(response, callback){
					var lastCharge = response.data.shift();
					if (params.amount > lastCharge.amount) {
						chargesCreate(params, callback);
					} else {
						callback('Amount must be greater than ' + lastCharge.amount);
					}
				}
			], callback);
		}
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

	// PUBLIC API
	method('_profile',         _profile,        0);
	method('charges.create',   chargesCreate,   1);
	method('charges.leapfrog', chargesLeapfrog, 1);
	method('charges.list',     chargesList,     1);
	method('customers.create', customersCreate, 1);

})();