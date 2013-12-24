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
		},

		addClient: function(user, network) {
			ircFactory.clients[network._id] = {
				key: network._id,
				userId: user._id,
				network: network.name || network.server,
				nickname: network.nick,
				capabilities: network.internal.capabilities,
				tabs: network.internal.tabs
			};
			// add the record into this.clients
		},

		getClients: function() {
			var self = this,
				clients = {},
				networks = Networks.find({});
			// get the networks (we just get all here so we can do more specific tests on whether to connect them)

			networks.forEach(function(network) {
				var me = Meteor.users.findOne({_id: network.internal.userId}),
					reconnect = false;

				if (network.internal.status !== self.flags.disconnected) {
					reconnect = true;
				}

				if (reconnect) {
					clients[network._id] = {user: me, network: network};
					self.addClient(me, network);
					// add the client into our local cache
				}
			});
			// here we just mark them for connection by passing them into this.reconnect

			return clients;
		},

		addNetwork: function(user, network) {
			var userCount = Meteor.users.find({}).count(),
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
			var network = Networks.findOne({_id: client.key}),
				obj = {
					target: target.toLowerCase(),
					title: target,
					type: type,
					active: true,
					key: id
				};

			if (obj.target.trim() == '') {
				return false;
			}
			// empty, bolt it

			network.internal.tabs[obj.target] = obj;
			Networks.update({_id: client.key}, {$set: {'internal.tabs': network.internal.tabs}});
			// insert to db

			client.tabs = network.internal.tabs;
			// update tabs
		},

		activeTab: function(client, target, activate) {
			var obj = {};
			obj['internal.tabs.' + target + '.active'] = activate;

			Networks.update({_id: client.key}, {$set: obj});
			client.tabs[target].active = activate;
			// update the activation flag
		},

		removeTab: function(client, target) {
			var obj = {};
			obj['internal.tabs.' + target] = 1;
			// bit messy but create an object for mongodb query, if the target is 'ricki'
			// this tells us to unset 'internal.tabs.ricki'

			Networks.update({_id: client.key}, {$unset: obj});

			delete client.tabs[target];
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

	Manager.init();

	return _.extend(Manager, hooks);
};