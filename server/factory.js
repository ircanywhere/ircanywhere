IRCFactory = (function() {
	"use strict";

	var crypto = Meteor.require('crypto'),
		factory = Meteor.require('irc-factory').Api,
		axon = Meteor.require('axon'),
		_ = Meteor.require('underscore');
	// dependencies

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

			this.incoming.on('socket error', function(e) {
				if (e.syscall === 'connect' && e.code === 'ECONNREFUSED') {
					self.api.fork();
					// it's critical we call fork with no parameter or false, otherwise this process will close
				}
				// we've tried our original connect and got ECONNREFUSED, it's highly
				// likely that an irc-factory server isn't setup for us yet, lets try setting one up
			});

			this.incoming.on('message', function(message) {
				if (message.event == 'synchronize') {
					var keys = _.keys(self.clients),
						difference = _.intersection(keys, message.keys);

					if (difference.length > 0) {
						console.log('reconnecting..', difference);
					}
					// we have some clients to reconnect it seems..
				} else {
					console.log(message);
					// any other events are irc events from irc-factory
				}
			});
			// now we define how to handle our incoming events
		},

		/*onIRC: function(key, e, args) {
			var client = this.clients[key];
			// get our client 

			if (e === 'socketinfo') {
				// XXX - at the moment we do nothing with socketinfo stuff
				// not sure if we ever will, maybe for an ident daemon? probably.
			} else {
				Meteor.ircHandler.handle(client, e, args);
				// send this data over to handleEvents where we'll do a switch matching
				// all the commands and sending them to individual functions
			}
		},*/

		create: function(user, network) {
			var key = network._id;
			// generate a key

			this.clients[key] = {
				key: key,
				userId: user._id,
				networkId: network._id,
				networkName: network.server
			};
			// store it in the clients object

			Meteor.networkManager.changeStatus(key, Meteor.networkManager.flags.connecting);
			// mark the network as connecting, the beauty of meteor comes into play here
			// no need to send a message to the client, live database YEAH BABY
			// we need to do this here because if we do it when we're calling create, it may have failed.

			this.outgoing.emit('createClient', key, network);
			// send to the process
		},

		destroy: function(key) {
			delete this.clients[key];
			// delete the record

			this.outgoing.emit('destroyClient', key);
			// send the destroy command
		},

		send: function(key, command, args) {
			this.outgoing.emit('call', key, command, args);
			// send message to the process (this should be used for IRC commands)
		}
	};

	return Factory;
}());
// create our factory object

Meteor.ircFactory = Object.create(IRCFactory);
Meteor.ircFactory.init();
// assign it to Meteor namespace so its accessible and rememberable