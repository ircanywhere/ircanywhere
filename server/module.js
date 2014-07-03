/**
 * IRCAnywhere server/modules.js
 *
 * @title ModuleManager
 * @copyright (c) 2013-2014 http://ircanywhere.com
 * @license GPL v2
 * @author Rodrigo Silveira
 */

var _ = require('lodash'),
	fs = require('fs'),
	Q = require('q');

/**
 * Handles loading of modules.
 *
 * @constructor
 */
function ModuleManager() {
	var self = this;

	application.ee.on('ready', function() {
		self.loadAllModules();
	});
}

/**
 * Loads a module by name. The name should be the name of the folder containing the module.
 *
 * @param {String} moduleName Name of module to load.
 */
ModuleManager.prototype.loadModule = function(moduleName) {
	var modulePath = 'modules/' + moduleName + '/server';

	fs.exists(modulePath, function (exists) {
		if (!exists) {
			return;
		}
		// does not have server module

		application.logger.log('info', 'Loading server module ' + moduleName);

		try {
			require('../' + modulePath);
			application.logger.log('info', 'Server module ' + moduleName + ' loaded');
		} catch (e) {
			application.logger.log('error', 'Failed to load module ' + moduleName);
			application.handleError(e);
		}
	});
};

/**
 * Loads all modules.
 */
ModuleManager.prototype.loadAllModules = function() {
	var self = this,
		readdir = Q.denodeify(fs.readdir),
		stat = Q.denodeify(fs.stat);

	readdir('modules')
		.then(function (files) {
			return Q.all(files.map(function (file) {
				return stat('modules/' + file)
					.then(function (stats) {
						stats.fileName = file;
						return stats;
					});
				// get stats for every file in modules to look for directories
			}));
		})
		.then(function (fileStats) {
			fileStats.forEach(function (file) {
				if (file.isDirectory()) {
					self.loadModule(file.fileName);
				}
			});
		})
		.fail(function (error) {
			application.logger.log('error', 'Failed to load modules');
			application.handleError(new Error(error));
		});
};

exports.ModuleManager = ModuleManager;
