IRCFactory = function(axon) {
	"use strict";

	var crypto = Meteor.require('crypto'),
		factory = Meteor.require('irc-factory').Api,
		_ = Meteor.require('underscore');

	var Factory = {
		api: new factory(),
		incoming: axon.socket('pull'),
		outgoing: axon.socket('pub-emitter'),
		clients: {},
		// this object will store our irc clients

		init: function() {
			var self = this;
			
			axon.codec.define('json', {
				encode: JSON.stringify,
				decode: JSON.parse
			});
			// setup a json codec

			this.incoming.connect(31920);
			this.incoming.format('json');
			this.outgoing.connect(31930);
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

			var socketError = Meteor.bindEnvironment(function(e) {
				application.logger.log('warn', 'factory socket error', e);

				if (e.syscall === 'connect' && e.code === 'ECONNREFUSED') {
					if (application.config.forkProcess) {
						self.api.fork();
					} else {
						self.api.setupServer();
					}
					// fork the daemon
				}
				// we've tried our original connect and got ECONNREFUSED, it's highly
				// likely that an irc-factory server isn't setup for us yet, lets try setting one up
			}, function(err) {
				application.logger.log('error', err.stack);
			});
			// create a socket error function

			this.incoming.on('socket error', socketError);
			this.incoming.on('message', messageHandler);
		},

		handleEvent: function(event, object) {
			var key = event[0],
				e = event[1],
				client = this.clients[key];

			if (_.isFunction(ircHandler[e])) {
				ircHandler[e].call(ircHandler, client, object);
			} else {
				console.log(event, object);
			}
		},

		create: function(user, network, skip) {
			var skip = skip || false,
				key = network._id;
			// generate a key, we just use the network id because it's unique per network
			// and doesn't need to be linked to a client, saves us hashing keys all the time

			if (!(key in this.clients)) {
				this.clients[key] = {
					key: key,
					userId: user._id,
					network:  network.name || network.server,
					capabilities: network.internal.capabilities || {}
				};
			}

			networkManager.changeStatus(key, networkManager.flags.connecting);
			// mark the network as connecting, the beauty of meteor comes into play here
			// no need to send a message to the client, live database YEAH BABY
			// we need to do this here because if we do it when we're calling create, it may have failed.

			this.outgoing.emit('createClient', key, network);

			application.logger.log('info', 'creating irc client', this.clients[key]);
		},

		destroy: function(key) {
			application.logger.log('info', 'destroying irc client', this.clients[key]);
			// log it before we destroy it below

			this.outgoing.emit('destroyClient', key);
		},

		send: function(key, command, args) {
			this.outgoing.emit('call', key, command, args);
		}
	};

	Factory.init();

	return Factory;
};