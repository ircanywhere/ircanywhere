SocketManager = function() {
	"use strict";

	var _ = require('lodash'),
		hooks = require('hooks'),
		Fiber = require('fibers');

	var Manager = {
		init: function() {
			application.app.io.set('authorization', function(data, accept) {
				Fiber(function() {
					Manager.handleAuth(data, accept);
				}).run();
			});
			// socket authorisation

			application.app.io.on('connection', function (client) {
				client.on('disconnect', function() {
					delete Sockets[client._id];
				});
				// handle disconnect

				Fiber(function() {
					Manager.handleConnect(client);
				}).run();
				// handle connect event
			});

			application.app.io.route('events', function(req) {
				Fiber(function() {
					Manager.handleEvents(req);
				}).run();
			});

			/*application.app.io.route('selectTab', function(req) {
				Fiber(function() {
					Manager.selectTab(req);
				}).run();
			});

			application.app.io.route('updateTab', function(req) {
				Fiber(function() {
					Manager.updateTab(req);
				}).run();
			});*/
			// XXX - Refactor these
		},

		handleAuth: function(data, accept) {
			var parsed = (data.headers.cookie) ? data.headers.cookie.split('; ') : [],
				cookies = {};

			parsed.forEach(function(cookie) {
				var split = cookie.split('=');
					cookies[split[0]] = split[1];
			});
			// get our cookies

			if (!cookies.token) {
				return accept(null, false);
			} else {
				var query = {};
					query['tokens.' + cookies.token] = {$exists: true};
				var user = application.Users.findOne(query);

				if (user === null) {
					return accept(null, false);
				} else {
					data.user = user;
				}
			}
			// validate the cookie

			accept(null, true);
			// accept the connection
		},

		handleConnect: function(client) {
			var user = client.handshake.user,
				networks = application.Networks.find({'internal.userId': user._id}).toArray(),
				tabs = application.Tabs.find({user: user._id}).toArray(),
				netIds = {};

			Sockets[client.id] = user;
			// remember the link between the socket and the user

			networks.forEach(function(network) {
				netIds[network._id] = network.name;
			});

			tabs.forEach(function(tab) {
				tab.users = application.ChannelUsers.find({network: netIds[tab.network], channel: tab.target}).toArray()
			});
			// loop tabs

			client.emit('user', user);
			client.emit('networks', networks);
			client.emit('tabs', tabs);
			// compile a load of data to send to the frontend
		},

		handleEvents: function(req) {
			var response = application.Events.find(req.data).toArray();
			// perform the query

			req.io.respond(response);
			// get the data
		}
	};

	application.ee.on('ready', function() {
		Fiber(Manager.init).run();
	});

	return _.extend(Manager, hooks);
};

exports.SocketManager = SocketManager;