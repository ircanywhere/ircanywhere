NetworkManager = function() {
	"use strict";
	
	var hooks = Meteor.require('hooks');

	var Manager = {
		flags: {
			connected: 'connected',
			disconnected: 'disconnected',
			connecting: 'connecting',
			closed: 'closed',
			failed: 'failed'
		},

		init: function() {
			Meteor.publish('networks', function() {
				return Networks.find({'internal.userId': this.userId});
			});

			var networks = Networks.find(),
				tabs = Tabs.find();

			networks.forEach(function(doc) {
				Clients[doc._id] = doc;
				Clients[doc._id].internal.tabs = {};
			});

			networks.observe({
				added: function(doc) {
					Clients[doc._id] = doc;
					Clients[doc._id].internal.tabs = {};
				},

				changed: function(doc, old) {
					Clients[doc._id] = doc;
					Clients[doc._id].internal.tabs = {};
					
					Tabs.find({user: doc.internal.userId, network: doc._id}).forEach(function(tab) {
						Clients[doc._id].internal.tabs[tab.target] = tab;
					});
				},

				removed: function(doc) {
					delete Clients[doc._id];
				}
			});
			// just sync clients up to this, instead of manually doing it
			// we're asking for problems that way doing it this way means
			// this object will be identical to the network list

			tabs.forEach(function(doc) {
				Clients[doc.network].internal.tabs[doc.target] = doc;
			});

			tabs.observe({
				added: function(doc) {
					Clients[doc.network].internal.tabs[doc.target] = doc;
				},

				changed: function(doc, old) {
					Clients[doc.network].internal.tabs[doc.target] = doc;
				},

				removed: function(doc) {
					delete Clients[doc.network].internal.tabs[doc.target];
				}
			});
			// sync Tabs to client.internal.tabs so we can do quick lookups when entering events
			// instead of querying each time which is very inefficient
		},

		getClients: function() {
			var self = this,
				clients = {},
				networks = Networks.find();
			// get the networks (we just get all here so we can do more specific tests on whether to connect them)

			networks.forEach(function(network) {
				var me = Meteor.users.findOne({_id: network.internal.userId}),
					reconnect = false;

				if (network.internal.status !== self.flags.disconnected) {
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
			var userCount = Meteor.users.find().count(),
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
				nodeId: Meteor.nodeId,
				userId: user._id,
				status: this.flags.closed,
				tabs: {},
				url: network.server + ':' + ((network.secure) ? '+' : '') + network.port
			}
			// this stores internal information about the network, it will be available to
			// the client but they wont be able to edit it, it also wont be able to be enforced
			// by the config settings or network settings, it's overwritten every time.

			network._id = Networks.insert(network);
			// insert the network. Just doing this will propogate the change directly
			// down the pipe to our client @ this.userId, also by calling insert without
			// a callback meteor automatically sets up a fiber, blocking the code in users.js

			return network;
		},

		addTab: function(client, target, type) {
			var obj = {
					user: client.internal.userId,
					network: client._id,
					target: target.toLowerCase(),
					title: target,
					type: type,
					selected: false,
					active: true
				};

			if (obj.target.trim() == '') {
				return false;
			}
			// empty, bolt it

			var tab = Tabs.findOne({network: client._id, target: target});

			if (tab !== undefined) {
				Tabs.insert(obj);
			}
			// insert to db
		},

		activeTab: function(client, target, activate) {
			Tabs.update({user: client.userId, network: client._id, target: target}, {$set: {active: activate}});
			// update the activation flag
		},

		selectTab: function(url, target, selected) {
			if (this.userId === null || url === '') {
				return false;
			}
			// no uid, bail

			var network = Networks.findOne({'internal.userId': this.userId, 'internal.url': url});
			
			Tabs.update({user: this.userId}, {$set: {selected: false}});
			Tabs.update({user: this.userId, network: network._id, target: target}, {$set: {selected: true}});
			// mark all as not selected apart from the one we've been told to select
		},

		removeTab: function(client, target) {
			Tabs.remove({user: client.internal.userId, network: client._id, target: target});
			// update tabs
		},

		connectNetwork: function(user, network) {
			ircFactory.create(user, network);
		},

		changeStatus: function(networkId, status) {
			if (!(status in this.flags)) {
				application.logger.log('warn', 'invalid status flag', {flag: status, network: networkId});
				return;
			}

			var query = (typeof networkId === 'object') ? networkId : {_id: networkId};
			Networks.update(query, {$set: {'internal.status': status}});
		}
	};

	Meteor.methods({
		selectTab: Manager.selectTab
	});
	// expose some methods to the frontend

	Manager.init();

	return _.extend(Manager, hooks);
};