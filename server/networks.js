NetworkManager = function() {
	"use strict";
	
	var _ = Meteor.require('underscore'),
		hooks = Meteor.require('hooks');

	var Manager = {
		flags: {
			connected: 'connected',
			disconnected: 'disconnected',
			connecting: 'connecting',
			closed: 'closed',
			failed: 'failed'
		},

		init: function() {
			Meteor.publish('networks', function(uid) {
				return Networks.find({'internal.userId': uid});
			});

			var networks = Networks.find();

			networks.forEach(function(doc) {
				Clients[doc._id] = doc;
			});

			networks.observe({
				added: function(doc) {
					Clients[doc._id] = doc;
				},

				changed: function(doc, old) {
					Clients[doc._id] = doc;
				},

				removed: function(doc) {
					delete Clients[doc._id];
				}
			});
			// just sync clients up to this, instead of manually doing it
			// we're asking for problems that way doing it this way means
			// this object will be identical to the network list
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

		addTab: function(client, target, type, id) {
			var network = Networks.findOne({_id: client}),
				obj = {
					target: target.toLowerCase(),
					title: target,
					type: type,
					selected: false,
					active: true,
					key: id
				};

			if (obj.target.trim() == '') {
				return false;
			}
			// empty, bolt it

			network.internal.tabs[obj.target] = obj;
			Networks.update({_id: client}, {$set: {'internal.tabs': network.internal.tabs}});
			// insert to db
		},

		activeTab: function(client, target, activate) {
			var obj = {};
			obj['internal.tabs.' + target + '.active'] = activate;

			Networks.update({_id: client}, {$set: obj});
			// update the activation flag
		},

		selectTab: function(client, target, selected) {
			var network = Networks.findOne({_id: client});

			for (var tab in network.internal.tabs) {
				network.internal.tabs[tab].selected = false;

				if (target == tab) {
					network.internal.tabs[tab].selected = true;
				}
			}

			Networks.update({_id: client}, {$set: {'internal.tabs': network.internal.tabs}});
			// what tab to mark selected
			// this IS different from active
		},

		removeTab: function(client, target) {
			var obj = {};
			obj['internal.tabs.' + target] = 1;
			// bit messy but create an object for mongodb query, if the target is 'ricki'
			// this tells us to unset 'internal.tabs.ricki'

			Networks.update({_id: client}, {$unset: obj});
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
		activeTab: Manager.activeTab,
		selectTab: Manager.selectTab
	});
	// expose some methods to the frontend

	Manager.init();

	return _.extend(Manager, hooks);
};