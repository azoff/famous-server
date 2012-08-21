(function(){

	"use strict";

	var fs  = require('fs');
	var path = require('path');
	var process = require('child_process');

	function Git(repo) {
		this.commands = [
			['--work-tree', repo].join('='),
			['--git-dir', path.join(repo, ".git")].join('=')
		];
	}

	function arrayToString(arr) {
		var result, index = 0, length;
		length = arr.reduce(function(l, b) {
			return l + b.length;
		}, 0);
		result = new Buffer(length);
		arr.forEach(function(b) {
			b.copy(result, index);
			index += b.length;
		});
		return result.toString('utf8');
	}

	function error(commands, stderr) {
		commands = ['git'].concat(commands).join(' ');
		return new Error([commands, stderr].join(':\n'));
	}

	Git.prototype.status = function(callback) {
		this.execute('status', callback);
	};

	Git.prototype.add = function() {
		var args = ['add'].concat(Array.prototype.slice.call(arguments));
		this.execute.apply(this, args);
	};

	Git.prototype.checkout = function() {
		var args = ['checkout'].concat(Array.prototype.slice.call(arguments));
		this.execute.apply(this, args);
	};

	Git.prototype.commit = function() {
		var args = ['commit', '-m'].concat(Array.prototype.slice.call(arguments));
		this.execute.apply(this, args);
	};

	Git.prototype.pull = function() {
		var args = ['pull'].concat(Array.prototype.slice.call(arguments));
		this.execute.apply(this, args);
	};

	Git.prototype.push = function() {
		var args = ['push'].concat(Array.prototype.slice.call(arguments));
		this.execute.apply(this, args);
	};

	Git.prototype.execute = function() {
		var args = Array.prototype.slice.call(arguments);
		var callback = args.pop();
		var commands = this.commands.concat(args);
		var output = { stdout:[], stderr:[], code:-1 };
		var git = process.spawn('git', commands);

		git.stdout.on('data', function (data) {
			output.stdout.push(data);
		});
		git.stderr.on('data', function (data) {
			output.stderr.push(data);
		});
		git.on('exit', function(code){
			output.code = code;
		});

		git.on('close', function(){
			if (output.code > 0) {
				var stderr = arrayToString(output.stderr);
				callback(error(commands, stderr), stderr);
			} else {
				callback(null, arrayToString(output.stdout));
			}
		});
	};

	exports.repo = function(repo) {
		return new Git(repo);
	};

})();