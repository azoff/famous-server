(function(){

	"use strict";

	var fs       = require('fs');
	var path     = require('path');
	var async    = require('async');
	var project  = require('src/project');

	var config   = fs.readFileSync(project.clientConfFile, 'utf8');
	var settings = JSON.parse(config);

	var rootDir     = path.join(project.rootDir, settings.relRootDir);
	var templateDir = path.join(rootDir, settings.templateDir);

	var git = require('src/git').repo(rootDir);

	function render(model, view, callback) {
		callback(null, view.replace(/\{(\w+)\}/g, function(match, key){
			return (key in model) ? model[key] : '';
		}));
	}

	function money(num) {
		num = num.toString().replace(/\$|\,/g, '');
		if (isNaN(num)) { num = "0"; }
		num = Math.floor(num * 100 + 0.50000000001);
		var cents = num % 100;
		num = Math.floor(num / 100).toString();
		if (cents < 10) {
			cents = "0" + cents;
		}
		for (var i = 0; i < Math.floor((num.length - (1 + i)) / 3); i++) {
			num = num.substring(0, num.length - (4 * i + 3)) + ',' + num.substring(num.length - (4 * i + 3));
		}
		return num + '.' + cents;
	}

	function template(model, view, callback) {
		var templatePath = path.join(templateDir, view + '.html');
		async.waterfall([
			async.apply(fs.readFile, templatePath, 'utf8'),
			async.apply(render, model)
		], callback);
	}

	function rebuild(filePath, fileContents, callback) {
		filePath = path.join(rootDir, filePath);
		async.series([
			async.apply(git.checkout.bind(git), settings.branch),
			async.apply(fs.writeFile, filePath, fileContents, 'utf8')
		], callback);
	}

	function update(name, cents, filePath, fileContents, callback) {
		var absPath = path.join(rootDir, filePath);
		var branchName = name.replace(/\W+/g, '_') + '_' + cents.toString();
		async.series([
			async.apply(git.fetch.bind(git)),
			async.apply(git.checkout.bind(git), settings.branch),
			async.apply(git.pull.bind(git), settings.remote, settings.branch),
			async.apply(git.checkout.bind(git), '-b', branchName),
			async.apply(fs.writeFile, absPath, fileContents, 'utf8'),
			async.apply(git.add.bind(git), absPath),
			async.apply(git.commit.bind(git), name + ', ' + cents),
			async.apply(git.push.bind(git), settings.remote, [branchName,settings.branch].join(':'))
		], callback);
	}

	exports.money    = money;
	exports.update   = update;
	exports.rebuild  = rebuild;
	exports.template = template;

})();