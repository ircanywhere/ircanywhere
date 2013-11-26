NetworkManager = (function() {
	"use strict";

	var Manager = {

		flags: {
			connected: 'connected',
			disconnected: 'disconnected',
			closed: 'closed',
			failed: 'failed'
		},

		init: function() {
			Meteor.publish('networks', function() {
				return Networks.find({'internal.userId': this.userId});
			});
			// handle our meteor publish collections here
		},

		addNetwork: function(user, network) {
			var self = this;

			network.autoRejoin = (network.autoRejoin === undefined) ? false : network.autoRejoin;
			network.autoConnect = (network.autoConnect === undefined) ? true : network.autoConnect;
			network.retryCount = (network.retryCount === undefined) ? 10 : network.retryCount;
			network.retryDelay = (network.retryDelay === undefined) ? 1000 : network.retryDelay;
			network.secure = (network.secure === undefined) ? false : network.secure;
			network.password = (network.password === undefined) ? '' : network.password;
			network.channels = (network.channels === undefined) ? [] : network.channels;
			// because some settings can be omitted, we're going to set them to
			// the hard-coded defaults if they are, ok. We don't need to worry about
			// validating them before hand either because app.js takes care of that.
			// 
			// XXX - this looks a bit messy, tidied up at some point? it would be nice
			//		 if validate could automatically cast these, maybe it can with cast: {}

			network.internal = {
				userId: user._id,
				status: self.flags.disconnected,
				channels: {},
				url: network.host + ':' + ((network.secure) ? '+' : '') + network.port
			}
			// this stores internal information about the network, it will be available to
			// the client but they wont be able to edit it, it also wont be able to be enforced
			// by the config settings or network settings, it's overwritten every time.

			Networks.insert(network);
		}
	};

	return Manager;
}());
// create our factory object

Meteor.networkManager = Object.create(NetworkManager);
Meteor.networkManager.init();
// assign it to Meteor namespace so its accessible and rememberable