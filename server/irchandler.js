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

			Networks.update(client.key, {$set: {
				'name': message.capabilities.network.name,
				'internal.status': Meteor.networkManager.flags.connected
			}});
			//Meteor.networkManager.changeStatus(client.key, Meteor.networkManager.flags.connected);
			// commented this out because we do other changes to the network object here
			// so we don't use this but we use a straight update to utilise 1 query instead of 2
		},

		closed: function(client, message) {
			Meteor.networkManager.changeStatus({_id: client.key, 'internal.status': {$ne: Meteor.networkManager.closed}}, Meteor.networkManager.flags.closed);
			// a bit of sorcery here, strictly speaking .changeStatus takes a networkId. But because of meteor's beauty
			// we can pass in an ID, or a selector. So instead of getting the status and checking it, we just do a mongo update
			// Whats happening is were looking for networks that match the id and their status has not been set to disconnected
			// which means someone has clicked disconnected, if not, just set it as closed (means we've disconnected for whatever reason)
		},

		failed: function(client, message) {
			Meteor.networkManager.changeStatus(client.key, Meteor.networkManager.flags.failed);
		}
	};

	return Handler;
}());

Meteor.ircHandler = Object.create(IRCHandler);
// dont call init here, none of these functions should ever be called directly
// they are called by factory js based on whether the function names match irc-factory events