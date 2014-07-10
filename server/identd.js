/**
 * IRCAnywhere server/identd.js
 *
 * @title IdentdServer
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
 * The configuration option `identd.enable` and `identd.port` will control whether this runs and what port
 * it runs on, the default port is 113 but you can bind it to whatever you like and use iptables
 * to forward to 113, without doing that IRCAnywhere will need elevated permissions to bind.
 *
 * @class IdentdServer
 * @method IdentdServer
 * @return void
 */
function IdentdServer() {
	var self = this;

	application.ee.on('ready', self.init.bind(self));
}

/**
 * Initiates the identd server and handles any configuration options
 *
 * @method init
 * @return void
 */
IdentdServer.prototype.init = function() {
	if (!application.config.identd.enable) {
		return false;
	}
	// not enabled, bail

	var self = this,
		bindPort = application.config.identd.port || 113;

	this.server = net.createServer(function(socket) {
		socket.buffer = '';
		socket.on('data', function(data) {
			self.onData(socket, data);
		})
	});

	this.server.on('error', function(error) {
		if (error.code === 'EACCES') {
			application.logger.log('warn', 'cannot bind identd server to port ' + bindPort + ', disabling, you should run with elevated permissions or bind to a different port and forward with iptables');
			application.config.identd.enable = false;
			return;
		}
		// no privilages

		if (error.code === 'EADDRINUSE') {
			application.logger.log('warn', 'cannot bind identd server to port ' + bindPort + ', something is already running on this port, possibly oidentd or something similar');
			application.config.identd.enable = false;
			return;
		}
		// already bound?

		console.log(error);
	});
	// any errors? these are not mission critical, we can still run without identd, so we just disable it and carry on

	this.server.listen(bindPort, function() {
		var address = self.server.address();
		application.logger.log('info', 'identd server listening on', address.address, address.port);
	});
}

/**
 * Handles incoming data to the identd server, this shouldn't ever be called, but the documentation is
 * here so people know what the function is doing and where responses are handled etc.
 * Protocol information can be found at http://en.wikipedia.org/wiki/Ident_protocol
 *
 * @method onData
 * @param {Socket} socket A valid socket from net.createServer callback
 * @param {BufferObject} data http://nodejs.org/api/net.html#net_event_data
 * @return void
 */
IdentdServer.prototype.onData = function(socket, data) {
	var self = this,
		line,
		response;

	socket.buffer += data.toString();

	if (socket.buffer.length < 512) {
		if (socket.buffer.indexOf('\n') === -1) {
			return;
		}
		// bail until we have a newline

		line = socket.buffer.split('\n')[0];
		response = self.parse(line);
		// we only want the first line
	}
	// if the data is below 512 respond to it, if more just straight onto disconnection

	socket.removeAllListeners();
	socket.end(response);
}

/**
 * Once the data has been handled it needs to be parsed so we can figure out what the identd request is
 * and respond to it accordingly to validate our connecting user.
 *
 * @method parse
 * @param {String} line The parsed ident line
 * @return {String} The response for the requester
 */
IdentdServer.prototype.parse = function(line) {
	var split = line.replace(/\s/g, '').split(','),
		local = 0,
		remote = 0;

	if (split.length < 2) {
		return;
	}
	// not letting anyone trick us here

	local = parseInt(split[0].trim());
	remote = parseInt(split[1].trim());

	if (!local || !remote) {
		return;
	}
	// still haven't got what we need, bail

	var item = IdentdCache[local];

	if (!item || (item && item.port != remote)) {
		return local.toString() + ', ' + remote.toString() + ' : ERROR : NO-USER';
		// can't find a user at this port, we can't validate it, respond.
	} else {
		delete IdentdCache[local];
		return local.toString() + ', ' + remote.toString() + ' : USERID : UNIX-IRCAnywhere : ' + item.username;
		// we've got a response
	}
}

IdentdServer.prototype = _.extend(IdentdServer.prototype, hooks);

exports.IdentdServer = IdentdServer;