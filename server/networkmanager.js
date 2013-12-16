NetworkManager = function() {
	"use strict";

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
		},

		getClients: function() {
			var clients = {},
				networks = Networks.find({}).fetch();
			// get the networks (we just get all here so we can do more specific tests on whether to connect them)

			for (var netId in networks) {
				var network = networks[netId],
					me = Meteor.users.findOne(network.internal.userId),
					reconnect = false;

				if (network.internal.status !== this.flags.disconnected) {
					reconnect = true;
				}

				if (reconnect) {
					clients[network._id] = {user: me, network: network};
					
					ircFactory.clients[network._id] = {
						key: network._id,
						userId: me._id,
						network: network.name || network.server,
						nickname: network.nickname,
						capabilities: network.internal.capabilities
					};
					// call create directly but with the skip parameter cause all we want to do is
					// add the record into this.clients
				}
			}
			// here we just mark them for connection by passing them into this.reconnect

			return clients;
		},

		addNetwork: function(user, network) {
			var userCount = Meteor.users.find({}).count(),
				userName = application.config.clientSettings.userNamePrefix + userCount;

			network.name = network.server;
			network.nickname = user.profile.nickname;
			network.user = userName;
			network.secure = network.secure || false;
			network.sasl = network.sasl || false;
			network.saslUsername = network.saslUsername || undefined;
			network.password = network.password || null;
			network.capab = true;
			// because some settings can be omitted, we're going to set them to
			// the hard-coded defaults if they are, ok. We don't need to worry about
			// validating them before hand either because app.js takes care of that.
			// 
			// XXX - this looks a bit messy, tidied up at some point? it would be nice
			//		 if simple-schema could automatically cast these, maybe it can with cast: {}

			network.internal = {
				nodeId: Meteor.nodeId,
				userId: user._id,
				status: this.flags.closed,
				channels: [],
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

		connectNetwork: function(user, network) {
			delete network.internal;

			ircFactory.create(user, network);
		},

		changeStatus: function(networkId, status) {
			if (!(status in this.flags)) {
				application.logger.log('warn', 'invalid status flag', {flag: status, network: networkId});
				return;
			}

			Networks.update(networkId, {$set: {'internal.status': status}});
		}
	};

	Manager.init();

	return Manager;
};