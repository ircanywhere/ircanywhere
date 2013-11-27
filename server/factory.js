var crypto = Meteor.require('crypto')

IRCFactory = (function() {
	"use strict";

	var Factory = {

		clients: {},
		// this object will store our irc clients

		init: function() {
			this.process = Meteor.require('irc-factory').process;
			// this is what we do to initialise the irc factory
			// this will basically be the client end of ircanywhere/irc-factory package
			// docs on how that work are in the README file

			this.process.on('message', function(m) {
				console.log(m);
			})
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

			this.process.send({message: 'create', data: {key: key, this.clients[key].object}});
			// send to the process
		}
	};

	return Factory;
}());
// create our factory object

Meteor.ircFactory = Object.create(IRCFactory);
Meteor.ircFactory.init();
// assign it to Meteor namespace so its accessible and rememberable