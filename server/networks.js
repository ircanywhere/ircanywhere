NetworkManager = function() {
	"use strict";
	
	var _ = require('lodash'),
		hooks = require('hooks'),
		helper = require('../lib/helpers').Helpers,
		mongo = require('mongo-sync'),
		Fiber = require('fibers');

	var Manager = {
		flags: {
			connected: 'connected',
			disconnected: 'disconnected',
			connecting: 'connecting',
			closed: 'closed',
			failed: 'failed'
		},

		init: function() {
			application.ee.on('ready', function() {
				application.app.io.set('authorization', function(data, accept) {
					Fiber(function() {
						var parsed = data.headers.cookie.split('; '),
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
					}).run();
				});
				// socket authorisation

				application.app.io.on('connection', function (client) {
					Fiber(function() {
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

						client.emit('sync', {
							user: user,
							networks: networks,
							tabs: tabs
						});
						// compile a load of data to send to the frontend
					}).run();

					/*Fiber(function() {
						var parsed = req.headers.cookie.split('; '),
							cookies = {};

						parsed.forEach(function(cookie) {
							var split = cookie.split('=');
								cookies[split[0]] = split[1];
						});
						// get our cookies

						if (!cookies.token) {
							return req.io.disconnect();
						} else {
							var query = {};
								query['tokens.' + cookies.token] = {$exists: true};
							var user = application.Users.findOne(query);

							if (user === null) {
								return req.io.disconnect();
							} else {
								Sockets[req.socket.id] = user;
							}
						}
						// validate the cookie

						var networks = application.Networks.find({'internal.userId': user._id}).toArray(),
							tabs = application.Tabs.find({user: user._id}).toArray(),
							netIds = {};

						networks.forEach(function(network) {
							netIds[network._id] = network.name;
						});

						tabs.forEach(function(tab) {
							tab.users = application.ChannelUsers.find({network: netIds[tab.network], channel: tab.target}).toArray()
						});
						// loop tabs

						req.io.respond({
							user: user,
							networks: networks,
							tabs: tabs
						});
						// compile a load of data to send to the frontend
					}).run();*/
				});

				application.app.io.route('selectTab', function(req) {
					Fiber(function() {
						Manager.selectTab(req);
					}).run();
				});

				application.app.io.route('updateTab', function(req) {
					Fiber(function() {
						Manager.updateTab(req);
					}).run();
				});

				var networks = application.Networks.find(),
					tabs = application.Tabs.find();

				networks.forEach(function(doc) {
					var id = doc._id.toString();
					if (!doc.internal) {
						return false;
					}

					Clients[id] = doc;
					Clients[id].internal.tabs = {};
				});
				// load up networks and push them into Clients

				application.ee.on('networks:insert', function(doc) {
					var id = doc._id.toString();
					if (!doc.internal) {
						return false;
					}

					Clients[id] = doc;
					Clients[id].internal.tabs = {};
				});

				application.ee.on('networks:update', function(doc) {
					var id = doc._id.toString();
					Clients[id] = doc;
					Clients[id].internal.tabs = {};
					application.Tabs.find({user: doc.internal.userId, network: doc._id}).forEach(function(tab) {
						Clients[id].internal.tabs[tab.target] = tab;
					});
				});

				application.ee.on('networks:delete', function(id) {
					delete Clients[id.toString()];
				});
				// just sync clients up to this, instead of manually doing it
				// we're asking for problems that way doing it this way means
				// this object will be identical to the network list
				// this method is inspired by meteor's observe capabilities

				application.ee.on('tabs:insert', function(doc) {
					Clients[doc.network.toString()].internal.tabs[doc.target] = doc;
				});

				application.ee.on('tabs:update', function(doc) {
					Clients[doc.network.toString()].internal.tabs[doc.target] = doc;
				});

				application.ee.on('tabs:delete', function(id) {
					_.each(Clients, function(value, key) {
						var network = _.find(value.internal.tabs, {'_id': id});
						delete Clients[key].internal.tabs[network.title];
					});
				});
				// sync Tabs to client.internal.tabs so we can do quick lookups when entering events
				// instead of querying each time which is very inefficient
			});
		},

		getClients: function() {
			var clients = {},
				networks =  application.Networks.find();
			// get the networks (we just get all here so we can do more specific tests on whether to connect them)

			networks.forEach(function(network) {
				var me = application.Users.findOne({_id: network.internal.userId}),
					reconnect = false;

				if (network.internal.status !== Manager.flags.disconnected) {
					reconnect = true;
				}

				if (reconnect) {
					clients[network._id] = {user: me, network: network};
					// add the client into our local cache
				}
			});
			// here we just mark them for connection by passing them into this.reconnect

			return clients;
		},

		addNetwork: function(user, network) {
			var userCount = application.Users.find().count(),
				userName = application.config.clientSettings.userNamePrefix + userCount;

			network.name = network.server;
			network.nick = user.profile.nickname;
			network.user = userName;
			network.secure = network.secure || false;
			network.sasl = network.sasl || false;
			network.saslUsername = network.saslUsername || undefined;
			network.password = network.password || null;
			network.capab = true;
			// because some settings can be omitted, we're going to set them to
			// the hard-coded defaults if they are, ok. We don't need to worry about
			// validating them before hand either because app.js takes care of that.
			// XXX - this looks a bit messy, tidied up at some point? it would be nice
			//		 if simple-schema could automatically cast these, maybe it can with cast: {}

			network.internal = {
				nodeId: application.nodeId,
				userId: user._id,
				status: this.flags.closed,
				url: network.server + ':' + ((network.secure) ? '+' : '') + network.port
			}
			// this stores internal information about the network, it will be available to
			// the client but they wont be able to edit it, it also wont be able to be enforced
			// by the config settings or network settings, it's overwritten every time.

			return application.Networks.insert(network)[0];
			// insert the network. Just doing this will propogate the change directly due to our observe driver
		},

		addTab: function(client, target, type, select) {
			var select = select || false,
				obj = {
					user: client.internal.userId,
					url: (type === 'network') ? client.internal.url : client.internal.url + '/' + target.toLowerCase(),
					network: client._id,
					target: target.toLowerCase(),
					title: target,
					type: type,
					selected: select,
					active: true
				};

			if (obj.target.trim() == '') {
				return false;
			}
			// empty, bolt it

			if (select) {
				application.Tabs.update({user: client.internal.userId, selected: true}, {$set: {selected: false}});
			}
			// are they requesting a new selected tab?

			var tab = application.Tabs.findOne({user: client.internal.userId, network: client._id, target: target});

			if (tab === null) {
				application.Tabs.insert(obj);
			} else {
				application.Tabs.update({user: client.internal.userId, network: client._id, target: target}, {$set: {active: true, selected: select}});
			}
			// insert to db, or update old record
		},

		activeTab: function(client, target, activate) {
			if (typeof target !== "boolean") {
				application.Tabs.update({user: client.internal.userId, network: client._id, target: target}, {$set: {active: activate}});
			} else {
				application.Tabs.update({user: client.internal.userId, network: client._id}, {$set: {active: target}}, {multi: true});
			}
			// update the activation flag
		},

		selectTab: function(req) {
			var user = Sockets[req.socket.id],
				url = req.data.url,
				userId = user._id;

			if (url === undefined || url === '') {
				return req.io.respond({success: false, error: 'invalid url'});
			}
			// no url, bail

			var net = application.Networks.findOne({'internal.userId': userId}, {fields: {id: 1, internal: 1}}),
				tab = application.Tabs.findOne({user: userId, url: url}),
				newTab = tab;

			if (tab !== null && !tab.selected) {
				application.Tabs.update({user: userId}, {$set: {selected: false}});
				application.Tabs.update({user: userId, url: url}, {$set: {selected: true}});
				// mark all as not selected apart from the one we've been told to select
			} else if (tab === null) {
				var netId = net._id.toString(),
					client = Clients[netId],
					target = url.split('/');

				if (target.length <= 1) {
					return false;
				}
				// we're not allowed to add a network like this

				if (helper.isChannel(client.internal.capabilities.channel.types, target[1])) {
					ircFactory.send(client._id, 'join', [target[1]]);
				} else {
					Manager.addTab(Clients[netId], target[1], 'query', true);
				}
				// create tab
			}

			return req.io.respond({success: true});
			// respond - we don't send new tab info down the line, we'll get it when it's synced up
			// we can safely change the tab if the response is true
		},

		updateTab: function(req) {
			var user = Sockets[req.socket.id],
				params = req.data,
				success = false;

			if (!params.tab) {
				return req.io.respond({success: false});
			}

			var tabId = params.tab,
				update = {$set: {}};

			if (params.hiddenUsers !== undefined && typeof params.hiddenUsers === 'boolean') {
				update['$set'] = {hiddenUsers: params.hiddenUsers};
				application.Tabs.update({_id: new mongo.ObjectId(tabId)}, update);
				success = true;
			} else if (params.hiddenEvents !== undefined && typeof params.hiddenEvents === 'boolean') {
				update['$set'] = {hiddenEvents: params.hiddenEvents};
				application.Tabs.update({_id: new mongo.ObjectId(tabId)}, update);
				success = true;
			}
			// we're only allowed to update these two properties via this method atm

			return req.io.respond({success: success});
		},

		removeTab: function(client, target) {
			// it's now up to the client to re-select the tab when they get a message saying it's been
			// removed, because of Ember's stateful urls, we can just do history.back() and get a reliable switch
			
			if (target) {
				application.Tabs.remove({user: client.internal.userId, network: client._id, target: target});
			} else {
				application.Tabs.remove({user: client.internal.userId, network: client._id});
			}
			// remove tabs
		},

		connectNetwork: function(user, network) {
			ircFactory.create(user, network);
		},

		changeStatus: function(networkId, status) {
			if (!(status in this.flags)) {
				application.logger.log('warn', 'invalid status flag', {flag: status, network: networkId});
				return;
			}

			application.Networks.update({_id: networkId}, {$set: {'internal.status': status}});
		}
	};

	Fiber(Manager.init).run();

	return _.extend(Manager, hooks);
};

exports.NetworkManager = NetworkManager;