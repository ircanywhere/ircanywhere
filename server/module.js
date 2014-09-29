/**
 * IRCAnywhere server/module.js
 *
 * @title ModuleManager
 * @copyright (c) 2013-2014 http://ircanywhere.com
 * @license GPL v2
 * @author Rodrigo Silveira
 */

var fs = require('fs'),
	Q = require('q');

/**
 * Handles loading of modules.
 *
 * @class ModuleManager
 * @method ModuleManager
 * @return void
 */
function ModuleManager() {
	var self = this;

	self.modules = {};
	self.loadAllModules();
}

/**
 * Loads a module by name. The name should be the name of the folder containing the module.
 *
 * @method loadModule
 * @param {String} moduleName Name of module to load.
 * @return void
 */
ModuleManager.prototype.loadModule = function(moduleName) {
	var self = this,
		deferred = Q.defer(),
		modulePath = './modules/' + moduleName + '/server';

	fs.exists(modulePath, function (exists) {
		if (!exists) {
			return;
		}
		// does not have server module

		self.modules[moduleName] = {
			name: moduleName,
			loaded: false,
			object: null
		};
		// create a local object

		application.logger.log('info', 'Loading server module ' + moduleName);

		try {
			var mod = require('../' + modulePath);

			self.modules[moduleName].object = mod;
			self.modules[moduleName].loaded = true;

			application.logger.log('info', 'Server module ' + moduleName + ' loaded [' + mod.version + ' by ' + mod.author + ']');
			
			deferred.resolve(self.modules[moduleName].object);
		} catch (e) {
			self.modules[moduleName].loaded = false;

			application.logger.log('error', 'Failed to load module ' + moduleName);
			application.handleError(e);
			
			deferred.reject();
		}
	});

	deferred.promise
		.then(function(module) {
			self.bindModule(module);
		});
};

/**
 * Loads all modules.
 *
 * @method loadAllModules
 * @return void
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

/**
 * Bind events and expose module to core functionality and vice versa
 *
 * @method bindModule
 * @param {Object} module A valid module object returned from require()
 * @return void
 */
ModuleManager.prototype.bindModule = function(module) {
	if (typeof module.init === 'function') {
		application.ee.on('ready', module.init.bind(module));
	}
};

exports.ModuleManager = ModuleManager;