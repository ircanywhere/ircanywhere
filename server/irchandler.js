IRCHandler = (function() {
	"use strict";

	var Handler = {

		registered: function(client, message) {
			var channels = {},
				network = Networks.findOne(client.key);
			// firstly we grab the network record from the database

			// XXX - send our connect commands, things that the user defines
			// 		 nickserv identify or something

			for (var key in network.channels) {
				var channel = network.channels[key],
					chan = channel.channel,
					password = channel.password || '';
				// split the channel name by space to check for a password

				channels[chan] = password;
			}
			// find our channels to automatically join from the network setup

			for (var key in network.internal.channels) {
				var channel = network.internal.channels[key],
					chan = channel.channel,
					password = channel.password || '';
				// split the channel name by space to check for a password

				channels[chan] = password;
			}
			// find the channels we were previously in (could have been disconnected and not saved)

			for (var channel in channels) {
				Meteor.ircFactory.send(client.key, 'join', [channel, channels[channel]]);
			}
			// merge the channels and join them all with their respective keys

			Meteor.networkManager.changeStatus(client.key, Meteor.networkManager.flags.connected);
			// update the status to connected
		}
	};

	return Handler;
}());
// create our application

Meteor.ircHandler = Object.create(IRCHandler);
// assign it to Meteor namespace so its accessible