(function(){

	"use strict";

	var fs = require('fs');
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

	function chargesList(params, callback) {
		if (params.call) {
			callback = params;
			params = {};
		}
		stripe.charges.list(params, callback);
	}

	function customersCreate(params, callback) {
		if (params.call) {
			params('Missing required parameters to create customer.');
		} else {
			stripe.customers.create(params, callback);
		}
	}

	function method(name, fn, expected) {
		exports[name] = function() {
			var args = Array.prototype.slice.call(arguments);
			var callback = args.pop();
			var safeArgs = args.slice(0, expected);
			safeArgs.push(callback);
			try { fn.apply(exports, safeArgs); }
			catch(e) {
				logger.error.error(e);
				callback(e.message);
			}
		};
	}

	// PUBLIC API
	method('_profile', _profile, 0);
	method('charges.list', chargesList, 1);
	method('customers.create', customersCreate, 1);

})();