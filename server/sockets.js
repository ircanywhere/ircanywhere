SocketManager = function() {
	"use strict";

	var _ = require('lodash'),
		hooks = require('hooks'),
		mongo = require('mongodb');

	var Manager = {
		allowedUpdates: {
			tabs: function(uid, query, update) {
				var allowed = ((_.has(update, 'hiddenUsers') && typeof update.hiddenUsers === 'boolean') ||
							   (_.has(update, 'hiddenEvents') && typeof update.hiddenEvents === 'boolean') || 
							   (_.has(update, 'selected') && typeof update.selected === 'boolean'));
				// been allowed

				if (allowed) {
					var find = application.Tabs.sync.findOne(_.extend(query, {user: uid}));
					// look for a user related to this record
					// if we've found one we can proceed

					return (find !== null);
				} else {
					return false;
				}
				// we've been allowed, check more strongly
			}
		},

		allowedInserts: {
			commands: function(uid, insert) {
				insert.user = uid;
				insert.timestamp = +new Date();
				// modify doc

				var allowed = ((insert.command && insert.network) &&
							   (insert.target !== '') &&
							   (insert.backlog !== undefined));

				if (allowed) {
					var find = application.Tabs.sync.findOne({networkName: insert.network, user: uid, target: insert.target});
					// try and find a valid tab

					if (find) {
						insert.network = find.network;
						return true;
					} else {
						return false;
					}
					// overwrite network with an id
				} else {
					return false;
				}
				// check more strongly..
			}
		},

		propogate: ['users', 'networks', 'tabs', 'events', 'channelUsers'],
		// collections with allowed update rules
		// very similar to Meteor - basically just reimplementing it, doesn't support advanced queries though

		init: function() {
			application.ee.on(['*', '*'], function(doc, ext) {
				var collection = this.event[0],
					eventName = this.event[1],
					clients = [];

				if (_.indexOf(Manager.propogate, collection) == -1) {
					return false;
				}

				if (collection === 'users') {
					clients.push(Users[doc._id.toString()]);
				} else if (collection === 'networks') {
					clients.push(Users[doc.internal.userId.toString()]);
				} else if (collection === 'tabs' || collection === 'events') {
					clients.push(Users[doc.user.toString()]);
				} else if (collection === 'channelUsers') {
					for (var id in Clients) {
						for (var tabId in Clients[id].internal.tabs) {
							var tab = Clients[id].internal.tabs[tabId];

							if (tab.networkName == doc.network && doc.channel == tab.target) {
								clients.push(Users[tab.user.toString()]);
							}
						}
					}
				}

				clients.forEach(function(client) {
					if (!client) {
						return false;
					}
					// bail if its undefined

					if (eventName === 'insert') {
						client.emit(eventName, {collection: collection, record: doc});
					} else if (eventName === 'update') {
						client.emit(eventName, {collection: collection, id: doc._id.toString(), record: doc});
					} else if (eventName === 'delete') {
						client.emit(eventName, {collection: collection, id: doc._id.toString()}); 
					}
				});
				// all of this code works by watching changes via the oplog, that way 
				// we dont need to worry about updating the database AND sending changes
				// to the frontend clients, we can just send the document down when we spot a change
				// to the clients who need to see it, a bit like meteor, without subscriptions
			});

			application.app.io.set('authorization', function(data, accept) {
				fibrous.run(function() {
					accept(null, Manager.handleAuth(data));
				});
			});
			// socket authorisation

			application.app.io.on('connection', function (client) {
				fibrous.run(function() {
					client.on('disconnect', function() {
						Manager.handleDisconnect(client);
					});
					// handle disconnect

					Manager.handleConnect(client);
					// handle connect event
				});
			});

			application.app.io.route('events', function(req) {
				fibrous.run(function() {
					Manager.handleEvents(req);
				});
			});

			application.app.io.route('insert', function(req) {
				fibrous.run(function() {
					var collection = req.data.collection,
						insert = req.data.insert,
						user = req.handshake.user;

					if (!collection || !insert) {
						return req.io.respond({success: false, error: 'invalid format'});
					}

					if (!_.isFunction(Manager.allowedInserts[collection])) {
						return req.io.respond({success: false, error: 'cant insert'});
					}

					if (!Manager.allowedInserts[collection](user._id, insert)) {
						return req.io.respond({success: false, error: 'not allowed'});
					}
					// have we been denied?

					application.mongo.collection(collection).sync.insert(insert);
					req.io.respond({success: true});
					// update and respond
				});
			});

			application.app.io.route('update', function(req) {
				fibrous.run(function() {
					var collection = req.data.collection,
						query = req.data.query,
						update = req.data.update,
						user = req.handshake.user;

					if (!collection || !query || !update) {
						return req.io.respond({success: false, error: 'invalid format'});
					}

					if (!_.isFunction(Manager.allowedUpdates[collection])) {
						return req.io.respond({success: false, error: 'cant update'});
					}

					if (query._id) {
						query._id = new mongo.ObjectID(query._id);
					}
					// update it to a proper mongo id

					if (!Manager.allowedUpdates[collection](user._id, query, update)) {
						return req.io.respond({success: false, error: 'not allowed'});
					}
					// have we been denied?

					if (collection === 'tabs' && _.has(update, 'selected')) {
						application.Tabs.sync.update({user: user._id}, {$set: {selected: false}}, {multi: true});
					}
					// also check for selected here, if a new tab is being selected then we will
					// force the de-selection of the others

					application.mongo.collection(collection).sync.update(query, {$set: update});
					req.io.respond({success: true});
					// update and respond
				});
			});
		},

		handleAuth: function(data) {
			var parsed = (data.headers.cookie) ? data.headers.cookie.split('; ') : [],
				cookies = {};

			parsed.forEach(function(cookie) {
				var split = cookie.split('=');
					cookies[split[0]] = split[1];
			});
			// get our cookies

			if (!cookies.token) {
				return false;
			} else {
				var query = {};
					query['tokens.' + cookies.token] = {$exists: true};
				var user = application.Users.sync.findOne(query);

				if (user === null) {
					return false;
				} else {
					if (new Date() > user.tokens[cookies.token].time) {
						var unset = {};
							unset['tokens.' + cookies.token] = 1;
						
						application.Users.sync.update(query, {$unset: unset});
						// token is expired, remove it

						return false;
					} else {
						data.user = user;
					}
				}
			}
			// validate the cookie

			return true;
			// accept the connection
		},

		handleConnect: function(client) {
			var user = client.handshake.user,
				networks = application.Networks.sync.find({'internal.userId': user._id}).sync.toArray(),
				tabs = application.Tabs.sync.find({user: user._id}).sync.toArray(),
				netIds = {},
				eventsQuery = {$or: []},
				usersQuery = {$or: []};

			Sockets[client.id] = user;
			Users[user._id.toString()] = client; 
			// remember the link between the socket and the user

			networks.forEach(function(network) {
				netIds[network._id] = network.name;
			});

			tabs.forEach(function(tab) {
				usersQuery['$or'].push({network: netIds[tab.network], channel: tab.title});
				eventsQuery['$or'].push({network: netIds[tab.network], target: tab.title});
			});
			// loop tabs

			var users = application.ChannelUsers.sync.find(usersQuery).sync.toArray(),
				events = application.Events.sync.find(_.extend({user: user._id}, eventsQuery)).sort({sort: {'message.time': 1}}).limit(50).sync.toArray();
			// sort and limit them

			client.emit('users', user);
			client.emit('networks', networks);
			client.emit('tabs', tabs);
			client.emit('channelUsers', users);
			client.emit('events', events);
			// compile a load of data to send to the frontend
		},

		handleDisconnect: function(client) {
			var user = Sockets[client.id];

			delete Users[user._id.toString()];
			delete Sockets[client.id];
			// clean up
		},

		handleEvents: function(req) {
			var response = application.Events.sync.find(req.data).sync.toArray();
			// perform the query

			req.io.respond(response);
			// get the data
		}
	};

	application.ee.on('ready', function() {
		fibrous.run(Manager.init);
	});

	return _.extend(Manager, hooks);
};

exports.SocketManager = SocketManager;