var crypto = Meteor.require('crypto')

IRCFactory = (function() {
	"use strict";

	var Factory = {

		clients: {},
		// this object will store our irc clients

		init: function() {
			var self = this;
			this.process = Meteor.require('irc-factory').process;
			// this is what we do to initialise the irc factory
			// this will basically be the client end of ircanywhere/irc-factory package
			// docs on how that work are in the README file

			this.process.on('message', function(m) {
				var message = m.message.toLowerCase(),
					data = m.data;
				// m is the JSON object coming, ask it what type of message is, and get the data
				
				switch (message) {
					case 'created':
						self.onCreated(data.key, data.ircObject.object);
						// call the onCreated method
					default:
						console.log(m);
				}
			});
		},

		onCreated: function(key, client) {
			console.log('Connecting', client.nickname, 'to', client.server, client.port, '(', client.secure, ')')
		},

		hash: function(user, network) {
			return crypto.createHash('md5').update(user._id + '-' + network._id).digest('hex');
			// generate an md5 hash of the user id + the network id
		},

		create: function(user, network) {
			var key = this.hash(user, network);
			// generate a key

			this.clients[key] = {
				key: key,
				userId: user._id,
				networkId: network._id,
				object: network
			};
			// store it in the clients object

			console.log(network);

			this.process.send({message: 'create', data: {key: key, ircObject: this.clients[key]}});
			// send to the process
		}
	};

	return Factory;
}());
// create our factory object

Meteor.ircFactory = Object.create(IRCFactory);
Meteor.ircFactory.init();
// assign it to Meteor namespace so its accessible and rememberable