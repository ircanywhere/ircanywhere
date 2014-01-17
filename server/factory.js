IRCFactory = function() {
	"use strict";

	var _ = require('lodash'),
		hooks = require('hooks'),
		crypto = require('crypto'),
		factory = require('irc-factory').Api;

	var Factory = {
		api: new factory(),
		options: {
			events: 31920,
			rpc: 31930,
			automaticSetup: true
		},
		// this object will store our irc clients

		init: function() {
			var interfaces = Factory.api.connect(_.extend(Factory.options, {fork: application.config.forkProcess}));
				Factory.events = interfaces.events,
				Factory.rpc = interfaces.rpc;
			// connect to our uplinks

			Factory.events.on('message', function(message) {
				fibrous.run(function() {
					if (message.event == 'synchronize') {
						var users = networkManager.getClients(),
							keys = _.keys(users),
							difference = _.difference(keys, message.keys);

						_.each(message.keys, function(key) {
							networkManager.changeStatus(key, networkManager.flags.connected);
						});
						
						_.each(difference, function(key) {
							var user = users[key];
							networkManager.connectNetwork(user.user, user.network);
						});
						// the clients we're going to actually attempt to boot up

						application.logger.log('warn', 'factory synchronize', message);
					} else {
						Factory.handleEvent(message.event, message.message);
					}
				});
			});
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
				key = network._id.toString();
			// generate a key, we just use the network id because it's unique per network
			// and doesn't need to be linked to a client, saves us hashing keys all the time

			networkManager.changeStatus(key, networkManager.flags.connecting);
			// mark the network as connecting

			this.rpc.emit('createClient', key, network);
			application.logger.log('info', 'creating irc client', Clients[key]);
		},

		destroy: function(key) {
			application.logger.log('info', 'destroying irc client', Clients[key]);
			// log it before we destroy it below

			this.rpc.emit('destroyClient', key.toString());
		},

		send: function(key, command, args) {
			this.rpc.emit('call', key.toString(), command, args);
		}
	};

	application.ee.on('ready', function() {
		fibrous.run(Factory.init);
	});

	return Factory;
};

exports.IRCFactory = IRCFactory;