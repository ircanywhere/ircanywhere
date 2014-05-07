/**
 * IRCAnywhere server/identd.js
 *
 * @title IRCFactory
 * @copyright (c) 2013-2014 http://ircanywhere.com
 * @license GPL v2
 * @author Ricki Hastings
*/

var _ = require('lodash'),
	hooks = require('hooks'),
	net = require('net');

/**
 * This is the IdentdServer object which creates an integrated identd server and can be turned
 * off via the configuration, this is a singleton and should never be instantiated more than once.
 *
 * The configuration option `identd` and `identdPort` will control whether this runs and what port
 * it runs on, the default port is 113 but you can bind it to whatever you like and use iptables
 * to forward to 113, without doing that IRCAnywhere will need elevated permissions to bind.
 *
 * @class IdentdServer
 * @method IdentdServer
 * @return void
 */
function IdentdServer() {
	var self = this;

	application.ee.on('ready', function() {
		fibrous.run(self.init.bind(self), application.handleError.bind(application));
	});
}

/**
 * Initiates the identd server and handles any configuration options
 *
 * @method init
 * @return void
 */
IdentdServer.prototype.init = function() {

}

exports.IdentdServer = IdentdServer;