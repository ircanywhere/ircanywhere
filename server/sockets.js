SocketManager = function() {
	"use strict";

	var _ = require('lodash'),
		hooks = require('hooks'),
		mongo = require('mongo-sync'),
		Fiber = require('fibers');

	var Manager = {
		allowedUpdates: {
			tabs: function(update) {
				return ((_.has(update, 'hiddenUsers') && typeof update.hiddenUsers === 'boolean') ||
						(_.has(update, 'hiddenEvents') && typeof update.hiddenUsers === 'boolean') || 
						(_.has(update, 'selected') && typeof update.hiddenUsers === 'boolean'));
			}
		},

		propogate: ['users', 'networks', 'tabs', 'events'],
		// collections with allowed update rules
		// very similar to Meteor - basically just reimplementing it, doesn't support advanced queries though

		init: function() {
			application.ee.on(['*', '*'], function(doc) {
				if (_.indexOf(Manager.propogate, this.event[0]) == -1) {
					return false;
				}

				if (this.event[0] === 'users') {
					var id = doc._id.toString(),
						client = Users[id];

					client.emit('update', {collection: 'users', record: doc});
				}
			});

			application.app.io.set('authorization', function(data, accept) {
				Fiber(function() {
					Manager.handleAuth(data, accept);
				}).run();
			});
			// socket authorisation

			application.app.io.on('connection', function (client) {
				client.on('disconnect', function() {
					Manager.handleDisconnect(client);
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

			application.app.io.route('update', function(req) {
				var collection = req.data.collection,
					query = req.data.query,
					update = req.data.update;

				if (!collection || !query || !update) {
					return req.io.respond({success: false, error: 'invalid format'});
				}

				if (!_.isFunction(Manager.allowedUpdates[collection])) {
					return req.io.respond({success: false, error: 'cant update'});
				}

				if (!Manager.allowedUpdates[collection](update)) {
					return req.io.respond({success: false, error: 'not allowed'});
				}
				// have we been denied?

				Fiber(function() {
					if (query._id) {
						query._id = new mongo.ObjectId(query._id);
					}
					// update it to a proper mongo id

					application.mongo.getCollection(collection).update(query, {$set: update});
					req.io.respond({success: true});
					// update and respond
				}).run();
				// all clear
			});
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
			Users[user._id.toString()] = client; 
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

		handleDisconnect: function(client) {
			var user = Sockets[client.id];

			delete Users[user._id.toString()];
			delete Sockets[client.id];
			// clean up
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