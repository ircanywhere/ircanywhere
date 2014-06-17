/**
 * IRCAnywhere server/server.js
 *
 * @title IRCServer
 * @copyright (c) 2013-2014 http://ircanywhere.com
 * @license GPL v2
 * @author Rodrigo Silveira
 */

var net = require('net'),
	hooks = require('hooks'),
	ServerSession = require('./serverSession').ServerSession;

/**
 * This is the IRC server that manages IRC client connections to ircanywhere. The IRC server
 * can be turned off by configuration. this is a singleton and should never be instantiated more than once.
 *
 * The configuration option `ircServer.enable` and `ircServer.port` will control whether this runs and what
 * port it runs on. The default port is 6667.
 *
 * @class IRCServer
 * @constructor IRCServer
 */
function IRCServer() {
	var self = this;

	application.ee.on('ready', function() {
		self.init();
		// TODO: Should init after making sure all networks are connected.
	});
}

/**
 * Setup server and start listening for connections.
 *
 * @returns void
 */
IRCServer.prototype.init = function() {
	if (!application.config.ircServer.enable) {
		return;
	}
	// not enabled, bail

	var self = this,
		bindPort = application.config.ircServer.port || 6667;

	application.Networks.update({_id: { $exists : true }}, {$set: {clientConnected: false}}, {multi: true},
		function (err) {
			if (err) {
				application.handleError(new Error(err));
			}
		});
	// Reset all client connections

	// TODO: support ssl
	this.server = net.createServer(function(socket) {
		self.onConnect(socket);
	});

	this.server.on('error', function(error) {
		application.logger.log('error', 'error starting IRC server');
		application.handleError(error);
	});

	this.server.listen(bindPort, function() {
		var address = self.server.address();
		application.logger.log('info', 'IRC server listening on', address.address, address.port);
	});
};

/**
 * Handles new server connection. Starts a session.
 *
 * @param {Object} socket Connection socket to the client
 */
IRCServer.prototype.onConnect = function(socket) {
	new ServerSession(socket);
};

exports.IRCServer = IRCServer;