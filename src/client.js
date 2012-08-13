(function(){

	"use strict";

	var fs       = require('fs');
	var path     = require('path');
	var async    = require('async');
	var project  = require('project');

	var config   = fs.readFileSync(project.clientConfFile, 'utf8');
	var settings = JSON.parse(config);

	var rootDir     = path.join(project.rootDir, settings.relRootDir);
	var templateDir = path.join(rootDir, settings.templateDir);

	var git = require('src/git').repo(rootDir);

	function render(model, view, callback) {
		callback(null, view.replace(/\{(\w+)\}/, function(match, key){
			return (key in model) ? model[key] : '';
		}));
	}

	function template(model, view, callback) {
		var templatePath = path.join(templateDir, view + '.html');
		async.waterfall([
			async.apply(fs.readFile, templatePath, 'utf8'),
			async.apply(render, model)
		], callback);
	}

	function update(msg, filePath, fileContents, callback) {
		filePath = path.join(rootDir, filePath);
		async.series([
			async.apply(fs.writeFile, filePath, fileContents, 'utf8'),
			async.apply(git.add, filePath),
			async.apply(git.commit, msg),
			async.apply(git.push, 'origin', 'master')
		], callback);
	}

	exports.update   = update;
	exports.template = template;

})();