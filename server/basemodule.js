/**
 * IRCAnywhere server/basemodule.js
 *
 * @title Module
 * @copyright (c) 2013-2014 http://ircanywhere.com
 * @license GPL v2
 * @author Ricki Hastings
 */

/**
 * Base class for creating modules
 *
 * @class Module
 * @method Module
 * @return void
 */
function Module() {
	
}

/**
 * Extend function used to extend objects with base module functionality so they
 * can hook into core events. This should only be called once per module, if a module
 * needs to contain multiple files, this object can be pulled in from multiple files
 * with exports and require and the output can be extended once.
 *
 * @class Module
 * @method extend
 * @param {Object} object The module object to extend
 * @return void
 */
Module.prototype.extend = function(object) {
	for (var key in object) {
		if (!object.hasOwnProperty(key)) {
			continue;
		}
		// ignore prototype properties

		var methods = object[key],
			classObject = null;
		
		switch (key) {
			case 'application':
				classObject = application;
				break;
			case 'identdServer':
				classObject = identdServer;
				break;
			case 'userManager':
				classObject = userManager;
				break;
			case 'rpcHandler':
				classObject = rpcHandler;
				break;
			case 'networkManager':
				classObject = networkManager;
				break;
			case 'ircHandler':
				classObject = ircHandler;
				break;
			case 'channelManager':
				classObject = channelManager;
				break;
			case 'eventManager':
				classObject = eventManager;
				break;
			case 'commandManager':
				classObject = commandManager;
				break;
			default:
				classObject = null;
				break;
		}
		// figure out what class we're trying to bind to

		if (!classObject) {
			continue;
		}
		// invalid class

		for (var hook in methods) {
			if (!methods.hasOwnProperty(hook)) {
				continue;
			}

			var split = hook.split(':');

			if (split.length !== 2) {
				continue;
			}
			// wrong size, continue

			this.bindFunction(key, classObject, split, methods[hook], object);
		}
		// loop and split the methods
	}

	return object;
}

/**
 * Used to bind hooks for a function on a core object
 *
 * @class Module
 * @method bindFunction
 * @param {String} key Class name
 * @param {Object} classObject Class object
 * @param {Array} split An array containing two values, 'pre|post|hook' and method name
 * @param {Function} fn A callback
 * @param {Object} object The base object where the fn belongs in
 * @return void
 */
Module.prototype.bindFunction = function(key, classObject, split, fn, object) {
	var hook = split[0],
		method = split[1];

	if (hook !== 'bind' && (!classObject[method] || !classObject[hook])) {
		application.logger.log('error', 'Failed to bind hook on', key, split);
		return;
	}

	if (hook === 'bind') {
		classObject.__proto__[method] = fn.bind(object, classObject);
	} else {
		classObject[hook](method, fn.bind(object));
	}
}

exports.Module = Module;