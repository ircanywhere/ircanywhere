IRCHandler = (function() {
	"use strict";

	var Handler = {

		ready: function(client, message) {
			var channels = {},
				network = Networks.findOne(client.key);
			// firstly we grab the network record from the database

			// XXX - send our connect commands, things that the user defines
			// 		 nickserv identify or something

			for (var key in network.channels) {
				var channel = network.channels[key],
					chan = channel.channel,
					password = channel.password || '';

				channels[chan] = password;
			}
			// find our channels to automatically join from the network setup

			for (var key in network.internal.channels) {
				var channel = network.internal.channels[key],
					chan = channel.channel,
					password = channel.password || '';

				channels[chan] = password;
			}
			// find the channels we were previously in (could have been disconnected and not saved)

			for (var channel in channels) {
				Meteor.ircFactory.send(client.key, 'raw', ['JOIN', channel, channels[channel]]);
			}

			Meteor.networkManager.changeStatus(client.key, Meteor.networkManager.flags.connected);
		}
	};

	return Handler;
}());

Meteor.ircHandler = Object.create(IRCHandler);
// dont call init here, none of these functions should ever be called directly
// they are called by factory js based on whether the function names match irc-factory events