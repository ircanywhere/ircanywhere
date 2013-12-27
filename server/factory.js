IRCFactory = function() {
	"use strict";

	var hooks = Meteor.require('hooks'),
		crypto = Meteor.require('crypto'),
		factory = Meteor.require('irc-factory').Api;

	var Factory = {
		api: new factory(),
		options: {
			events: 31920,
			rpc: 31930,
			automaticSetup: true,
			fork: application.config.forkProcess
		},
		// this object will store our irc clients

		init: function() {
			var self = this,
				interfaces = this.api.connect(this.options);

			this.events = interfaces.events,
			this.rpc = interfaces.rpc;
			// connect to our uplinks

			var messageHandler = Meteor.bindEnvironment(function(message) {
				if (message.event == 'synchronize') {
					var users = networkManager.getClients(),
						keys = _.keys(users),
						difference = _.difference(keys, message.keys);
					
					_.each(difference, function(key) {
						var user = users[key];
						networkManager.connectNetwork(user.user, user.network);
					});
					// the clients we're going to actually attempt to boot up

					application.logger.log('warn', 'factory synchronize', message);
				} else {
					self.handleEvent(message.event, message.message);
				}
			}, function(err) {
				application.logger.log('error', err.stack);
			});
			// create an on message function but bind it in our meteor environment
			
			this.events.on('message', messageHandler);
		},

		handleEvent: function(event, object) {
			var key = event[0],
				e = event[1],
				client = Clients[key];

			if (_.isFunction(ircHandler[e])) {
				ircHandler[e].call(ircHandler, client, object);
			}
			
			console.log(event, object);
		},

		create: function(user, network, skip) {
			var skip = skip || false,
				key = network._id;
			// generate a key, we just use the network id because it's unique per network
			// and doesn't need to be linked to a client, saves us hashing keys all the time

			networkManager.changeStatus(key, networkManager.flags.connecting);
			// mark the network as connecting, the beauty of meteor comes into play here
			// no need to send a message to the client, live database YEAH BABY
			// we need to do this here because if we do it when we're calling create, it may have failed.

			this.rpc.emit('createClient', key, network);
			application.logger.log('info', 'creating irc client', Clients[key]);
		},

		destroy: function(key) {
			application.logger.log('info', 'destroying irc client', Clients[key]);
			// log it before we destroy it below

			this.rpc.emit('destroyClient', key);
		},

		send: function(key, command, args) {
			this.rpc.emit('call', key, command, args);
		}
	};

	Factory.init();

	return Factory;
};