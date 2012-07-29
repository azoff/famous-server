(function(){

	"use strict";

	var logger = require('src/logger');

	function stats(callback) {
		callback(null, {
			hrtime: process.hrtime(),
			memory: process.memoryUsage()
		});
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
	method('stats', stats, 0);

})();