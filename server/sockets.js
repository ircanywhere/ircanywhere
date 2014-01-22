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
						client.send(eventName, {collection: collection, record: doc});
					} else if (eventName === 'update') {
						client.send(eventName, {collection: collection, id: doc._id.toString(), record: doc});
					} else if (eventName === 'delete') {
						client.send(eventName, {collection: collection, id: doc._id.toString()});
					}
				});
				// all of this code works by watching changes via the oplog, that way 
				// we dont need to worry about updating the database AND sending changes
				// to the frontend clients, we can just send the document down when we spot a change
				// to the clients who need to see it, a bit like meteor, without subscriptions
			});

			application.sockjs.on('connection', function (client) {
				client.send = function(event, data) {
					client.write(JSON.stringify({event: event, data: data}));
					return client;
				}
				// define a function to ease this

				client.on('data', function(message) {
					fibrous.run(function() {
						var parsed = JSON.parse(message),
							event = parsed.event,
							data = parsed.data;

						if (event === 'authenticate') {
							Manager.handleAuth(client, data, function() {
								Manager.handleConnect(client);
								// handle success
							});
						}
						// socket authentication

						if (event === 'events') {
							Manager.handleEvents(client, data);
						}
						// handle requesting of data from events collection

						if (event === 'insert') {
							Manager.handleInsert(client, data);
						}
						// handle inserts

						if (event === 'update') {
							Manager.handleUpdate(client, data);
						}
						// handle updates
					});
				});

				client.on('close', function() {
					fibrous.run(function() {
						Manager.handleDisconnect(client);
					});
				});
				// handle disconnects
			});
		},

		handleAuth: function(client, data, callback) {
			var parsed = (data) ? data.split('; ') : [],
				cookies = {};

			parsed.forEach(function(cookie) {
				var split = cookie.split('=');
					cookies[split[0]] = split[1];
			});
			// get our cookies

			if (!cookies.token) {
				client.send('authenticate', false).close();
				return false;
			} else {
				var query = {};
					query['tokens.' + cookies.token] = {$exists: true};
				var user = application.Users.sync.findOne(query);

				if (user === null) {
					client.send('authenticate', false).close();
					return false;
				} else {
					if (new Date() > user.tokens[cookies.token].time) {
						var unset = {};
							unset['tokens.' + cookies.token] = 1;
						
						application.Users.sync.update(query, {$unset: unset});
						// token is expired, remove it

						client.send('authenticate', false).close();
						return false;
					} else {
						client.user = user;
					}
				}
			}
			// validate the cookie

			callback();
			// go go
		},

		handleConnect: function(client) {
			var user = client.user,
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

			client.send('users', user);
			client.send('networks', networks);
			client.send('tabs', tabs);
			client.send('channelUsers', users);
			client.send('events', events);
			// compile a load of data to send to the frontend
		},

		handleDisconnect: function(client) {
			var user = Sockets[client.id];

			delete Users[user._id.toString()];
			delete Sockets[client.id];
			// clean up
		},

		handleEvents: function(client, data) {
			var response = application.Events.sync.find(data).sync.toArray();
			// perform the query

			client.send('events', response);
			// get the data
		},

		handleInsert: function(client, data) {
			var collection = data.collection,
				insert = data.insert,
				user = client.user;

			if (!collection || !insert) {
				return client.send('error', {command: 'insert', error: 'invalid format'});
			}

			if (!_.isFunction(Manager.allowedInserts[collection])) {
				return client.send('error', {command: 'insert', error: 'cant insert'});
			}

			if (!Manager.allowedInserts[collection](user._id, insert)) {
				return client.send('error', {command: 'insert', error: 'not allowed'});
			}
			// have we been denied?

			application.mongo.collection(collection).sync.insert(insert);
			// insert
		},

		handleUpdate: function(client, data) {
			var collection = data.collection,
				query = data.query,
				update = data.update,
				user = client.user;

			if (!collection || !query || !update) {
				return client.send('error', {command: 'update', error: 'invalid format'});
			}

			if (!_.isFunction(Manager.allowedUpdates[collection])) {
				return client.send('error', {command: 'update', error: 'cant update'});
			}

			if (query._id) {
				query._id = new mongo.ObjectID(query._id);
			}
			// update it to a proper mongo id

			if (!Manager.allowedUpdates[collection](user._id, query, update)) {
				returnclient.send('error', {command: 'update', error: 'not allowed'});
			}
			// have we been denied?

			if (collection === 'tabs' && _.has(update, 'selected')) {
				application.Tabs.sync.update({user: user._id}, {$set: {selected: false}}, {multi: true});
			}
			// also check for selected here, if a new tab is being selected then we will
			// force the de-selection of the others

			application.mongo.collection(collection).sync.update(query, {$set: update});
			// update
		}
	};

	application.ee.on('ready', function() {
		fibrous.run(Manager.init);
	});

	return _.extend(Manager, hooks);
};

exports.SocketManager = SocketManager;