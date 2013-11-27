

NetworkManager = (function() {
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
			// handle our meteor publish collections here
		},

		addNetwork: function(user, network) {
			var userCount = Meteor.users.find({}).count() + 1,
				ident = Meteor.config.clientSettings.identPrefix + userCount;

			network.nick = user.profile.nickname + '-';
			network.ident = ident;
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
			//		 if simple-schema could automatically cast these, maybe it can with cast: {}

			network.internal = {
				userId: user._id,
				status: this.flags.closed,
				channels: {},
				url: network.host + ':' + ((network.secure) ? '+' : '') + network.port
			}
			// this stores internal information about the network, it will be available to
			// the client but they wont be able to edit it, it also wont be able to be enforced
			// by the config settings or network settings, it's overwritten every time.

			network._id = Networks.insert(network);
			// insert the network. Just doing this will propogate the change directly
			// down the pipe to our client @ this.userId, also by calling insert without
			// a callback meteor automatically sets up a fiber, blocking the code in users.js

			console.log(network);

			return network;
		},

		connectNetwork: function(user, network) {
			for (var channel in network.channels) {
				var split = channel.split(' '),
					chan = split[0],
					pass = (split[1] !== undefined) ? split[1] : '';
				// split the channel name up

				network.internal.channels[chan] = pass;
			}
			// move into network.internal.channels
			// we do this because we manually join our channels instead of sending
			// them into node-irc immediately, because it's crappy and doesn't support passwords

			network.channels = [];
			network.debug = false;
			network.floodProtection = false;
			network.selfSigned = true;
			network.certExpired = true;
			network.stripColours = false;
			network.channelPrefxies = '&#';
			// set some node-irc default settings, channel prefixes is assumed here
			// but will be confirmed when we get the capabilities back later on

			Meteor.ircFactory.create(user, network);
			// tell the factory to create a network

			Networks.update(network._id, {$set: {'internal.status': this.flags.connecting}});
			// mark the network as connecting, the beauty of meteor comes into play here
			// no need to send a message to the client, live database YEAH BABY
		}
	};

	return Manager;
}());
// create our factory object

Meteor.networkManager = Object.create(NetworkManager);
Meteor.networkManager.init();
// assign it to Meteor namespace so its accessible and rememberable