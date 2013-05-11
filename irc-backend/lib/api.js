
var defconf = require('../config.json');

exports.API = {};
exports.API.authentication = defconf.api.authentication;
// irc.anywhere:fjr838shfks

var system = require('./system').System,
	server = require('./server').Server,
	stats = require('./stats').Stats,
	database = require('./database').Database,
	factory = require('./factory').Factory;
// any external objects we need

/*
 * API::disconnectNetwork
 *
 * A function to sequentially disconnect an array of networks
 */
exports.API.disconnectNetwork = function(i, objects)
{
	"use strict";

	if (i < objects.length)
	{
		var object = objects[i];

		if (server.client_data[object.user].networks[object.net].socket_key !== undefined ||
			server.client_data[object.user].networks[object.net].socket_key !== 'undefined')
			factory.destroy(server.client_data[object.user].networks[object.net].socket_key);
		// disconnect the client if it exists
		
		exports.API.disconnectNetwork(i + 1, objects);
	}
};

/*
 * API::disconnectWebSocket
 *
 * A function to sequentially disconnect an array of websockets
 */
exports.API.disconnectWebSocket = function(i, objects)
{
	"use strict";
	
	if (i < objects.length)
	{
		var socket = objects[i].socket,
			message = (objects[i].suspend) ? 'Your account is currently suspended, for more information contact <a href="mailto:support@ircanywhere.com">support@ircanywhere.com</a>.' : 'Your connection has been forcefully disconnected for the following reason: ' + objects[i].reason + '. You can reconnect by refreshing.';

		socket.emit('error', {'error_type': 'WS_CLOSE', 'error': message}, function(data)
		{
			if (data === 'recieved')
			{
				socket.disconnect();
			}
		});
		// send a message telling the user they've been forcefully disconnected
		// and then disconnect when we've got reciept of the message being sent
		// GO SOCKET.IO

		exports.API.disconnectWebSocket(i + 1, objects);
	}
};

/*
 * API::statsRoute
 *
 * Handle the stats route
 */
exports.API.statsRoute = function()
{
	"use strict";
	
	return {json: stats.collectStatistics(), code: 200};
};

/*
 * API::disconnectRoute
 *
 * Handle the disconnect route
 * --
 * This function disconnects a user from all their networks.. or
 * a user from a specific network
 *
 * Usage: /api/disconnect/:user/:network_id?
 * Requires: auth
 * Optional: reason
 */
exports.API.disconnectRoute = function(req)
{
	"use strict";
	
	var user = req.params.user,
		network = req.params.network,
		reason = req.param('reason', 'Disconnecting'),
		disconnectedFrom = [],
		tasks = [],
		ni = {};

	if (user && (server.client_data[user] === undefined))
	{
		return {
			json: {error: 'Invalid user'},
			code: 400
		};
	}
	// check if the user exists first

	if (network && (server.client_data[user].networks[network] === undefined))
	{
		return {
			json: {error: 'Invalid network'},
			code: 400
		};
	}
	// check if network exists

	if (user && !network)
	{
		var networks = server.client_data[user].networks;
			tasks.length = 0;

		for (var net in networks)
		{
			if (networks.hasOwnProperty(net))
			{
				ni = server.client_data[user].networks[net];
				
				disconnectedFrom.push({_id: net, host: ni.url});
				tasks.push({user: user, net: net, ni: ni, reason: reason});
			}
		}

		if (tasks.length > 0)
		{
			exports.API.disconnectNetwork(0, tasks);
		}
	}
	
	if (user && network)
	{
		ni = server.client_data[user].networks[network];
		tasks.length = 0;
		
		disconnectedFrom.push({_id: network, host: ni.url});
		tasks.push({user: user, net: network, ni: ni, reason: reason});

		exports.API.disconnectNetwork(0, tasks);
	}
	// we've got this far so let's figure out what to do next

	return {
		json: {success: true, user: user, disconnectedFrom: disconnectedFrom},
		code: 200
	};
};

/*
 * API::closeRoute
 *
 * Handle the close websocket route
 * --
 * This function closes all websocket connections
 *
 * Usage: /api/close/:user
 * Requires: auth
 */
exports.API.closeRoute = function(req)
{
	"use strict";
	
	var user = req.params.user,
		disconnected = [],
		tasks = [];

	if (user && server.client_data[user] === undefined)
	{
		return {
			json: {error: 'Invalid user'},
			code: 400
		};
	}
	// check if the user exists first

	if (server.client_data[user].sockets.length === 0)
	{
		return {
			json: {success: true, user: user, disconnected: []},
			code: 200
		};
	}
	// no sockets anyway lets just send out a success response

	for (var socketId in server.client_data[user].sockets)
	{
		if (server.client_data[user].sockets.hasOwnProperty(socketId))
		{
			var socket = server.client_data[user].sockets[socketId],
				ip = socket.handshake.address.address;

			disconnected.push({ip: ip});
			tasks.push({socket: socket, reason: 'Disconnected', suspend: false});
		}
	}

	if (tasks.length > 0)
	{
		exports.API.disconnectWebSocket(0, tasks);
	}
	// find all sockets and disconnect them

	return {
		json: {success: true, user: user, disconnected: disconnected},
		code: 200
	};
};

/*
 * API::shutdownRoute
 *
 * Handle the shutdown route
 * --
 * This function closes all websocket connections and disconnects all users
 * from any networks they are connected to, once that is done their records
 * are deleted from the internal strucutre.
 *
 * Usage: /api/shutdown/:user
 * Requires: auth
 * Optional: suspend (boolean)
 */
exports.API.shutdownRoute = function(req)
{
	"use strict";
	
	var user = req.params.user,
		reason = req.param('reason', 'Disconnected'),
		suspend = (req.param('suspend', 'false') === 'false') ? false : true,
		disconnected = [],
		disconnectedFrom = [],
		tasks = [];

	if (user && server.client_data[user] === undefined)
	{
		return {
			json: {error: 'Invalid user'},
			code: 400
		};
	}
	// check if the user exists first

	if (suspend)
	{
		database.userModel.update({account: user}, {suspended: true}, function(err)
		{
			if (err)
			{
				system.log.error(err);
			}
		});
	}
	// if suspend is ticked then change the users record to suspended

	for (var socketId in server.client_data[user].sockets)
	{
		if (server.client_data[user].sockets.hasOwnProperty(socketId))
		{
			var socket = server.client_data[user].sockets[socketId],
				ip = socket.handshake.address.address;

			disconnected.push({ip: ip});
			tasks.push({socket: socket, reason: reason, suspend: suspend});
		}
	}

	if (tasks.length > 0)
	{
		exports.API.disconnectWebSocket(0, tasks);
	}
	// find all sockets and disconnect them

	var networks = server.client_data[user].networks;
		tasks.length = 0;
	// reset tasks

	for (var net in networks)
	{
		if (networks.hasOwnProperty(net))
		{
			var ni = server.client_data[user].networks[net];
			
			disconnectedFrom.push({_id: net, host: ni.url});
			tasks.push({user: user, net: net, ni: ni, reason: reason});
		}
	}

	if (tasks.length > 0)
	{
		exports.API.disconnectNetwork(0, tasks);
	}
	// disconnect all networks

	return {
		json: {success: true, suspended: suspend, user: user, disconnected: disconnected, disconnectedFrom: disconnectedFrom},
		code: 200
	};
};

/*
 * API::createServer
 *
 * Creates our API routes
 */
exports.API.createServer = function()
{
	"use strict";
	
	var _this = this;

	server.app.post('/api/stats', function(req, res)
	{
		_this.handleRoute(_this.statsRoute, req, res);
	});

	server.app.post('/api/disconnect/:user/:network?', function(req, res)
	{
		_this.handleRoute(_this.disconnectRoute, req, res);
	});

	server.app.post('/api/close/:user', function(req, res)
	{
		_this.handleRoute(_this.closeRoute, req, res);
	});

	server.app.post('/api/shutdown/:user', function(req, res)
	{
		_this.handleRoute(_this.shutdownRoute, req, res);
	});
};

/*
 * API::handleRoute
 *
 * A wrapper for all individual routes, handles authentication etc
 */
exports.API.handleRoute = function(method, req, res)
{
	"use strict";
	
	var _this = this,
		auth = req.param('auth', null);
	
	if (auth !== _this.authentication)
	{
		res.json({error: 'Unauthorized'}, 401);
		// this means we have got invalid authentication
	}
	else
	{
		var returned = method(req, res);
		// call the method

		res.json(returned.json, returned.code);
		// return the data
	}
};