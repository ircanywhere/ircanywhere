IRCFactory = (function() {
	"use strict";

	var crypto = Meteor.require('crypto'),
		Factory = {

		clients: {},
		// this object will store our irc clients

		init: function() {
			var self = this;
			//this.process = Meteor.require('irc-factory').process;
			// this is what we do to initialise the irc factory
			// this will basically be the client end of ircanywhere/irc-factory package
			// docs on how that work are in the README file

			/*var fn = Meteor.bindEnvironment(function(m) {
				var message = m.message.toLowerCase(),
					data = m.data;
				// m is the JSON object coming, ask it what type of message is, and get the data
				
				switch (message) {
					case 'created':
						self.onCreated(data.key);
						break;
					case 'destroyed':
						self.onDestroyed(data.key);
						break;
					case 'closed':
						self.onClosed(data.key, data.timeout);
						break;
					case 'failed':
						self.onFailed(data.key);
						break;
					case 'irc':
						self.onIRC(data.key, data.e, data.arguments);
						break;
					default:
						//console.log(m);
						break;
				}
			}, function(e) {
				throw e;
			});
			// create a function to handle incoming messages and wrap it in meteor's environment

			this.process.on('message', fn);*/
		},

		onCreated: function(key) {
			Meteor.networkManager.changeStatus(this.clients[key].networkId, Meteor.networkManager.flags.connecting);
			// mark the network as connecting, the beauty of meteor comes into play here
			// no need to send a message to the client, live database YEAH BABY
			// we need to do this here because if we do it when we're calling create, it may have failed.
		},

		onDestroyed: function(key) {
			delete this.clients[key];
			// remove the client
		},

		onClosed: function(key, timeout) {
			Meteor.networkManager.changeStatus(this.clients[key].networkId, Meteor.networkManager.flags.closed);
			// mark the network as closed
		},

		onFailed: function(key) {
			Meteor.networkManager.changeStatus(this.clients[key].networkId, Meteor.networkManager.flags.failed);			// mark the network as closed
		},

		onIRC: function(key, e, args) {
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
				networkName: network.server
			};
			// store it in the clients object

			this.process.send({message: 'create', data: {key: key, ircObject: network}});
			// send to the process
		},

		destroy: function(key) {
			this.process.send({message: 'destroy', data: {key: key}});
			// send the destroy command (we handle the response later on)
		},

		send: function(key, command, args) {
			this.process.send({message: 'rpc', data: {key: key, command: command, args: args}});
			// send message to the process (this should be used for IRC commands)
		}
	};

	return Factory;
}());
// create our factory object

Meteor.ircFactory = Object.create(IRCFactory);
Meteor.ircFactory.init();
// assign it to Meteor namespace so its accessible and rememberable