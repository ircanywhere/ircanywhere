IRCHandler = (function() {
	"use strict";

	var Handler = {

		init: function() {
			
		},

		handle: function(client, e, args) {
			switch (e) {
				case 'registered':
					this.onRegister(client, args[0]);
					break;
				default:

					break;
			};
			// handle our event with a switch, we'll determine what to do
			// with irc parsed commands and where to send them here
		},

		onRegister: function(client, message) {
			var channels = {},
				network = Networks.findOne(client.networkId);
			// firstly we grab the network record from the database

			// XXX - send our connect commands, things that the user defines
			// 		 nickserv identify or something

			for (var key in network.channels) {
				var channel = network.channels[key],
					chan = channel.channel,
					password = (channel.password === undefined) ? '' : channel.password;
				// split the channel name by space to check for a password

				channels[chan] = password;
			}
			// find our channels to automatically join from the network setup

			for (var key in network.internal.channels) {
				var channel = network.internal.channels[key],
					chan = channel.channel,
					password = (channel.password === undefined) ? '' : channel.password;
				// split the channel name by space to check for a password

				channels[chan] = password;
			}
			// find the channels we were previously in (could have been disconnected and not saved)

			for (var channel in channels) {
				Meteor.ircFactory.send(client.key, 'send', [channel, channels[channel]]);
			}
			// merge the channels and join them all with their respective keys

			Meteor.networkManager.changeStatus(client.networkId, Meteor.networkManager.flags.connected);
			// update the status to connected
		}
	};

	return Handler;
}());
// create our application

Meteor.ircHandler = Object.create(IRCHandler);
Meteor.ircHandler.init();
// assign it to Meteor namespace so its accessible