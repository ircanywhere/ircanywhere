IRCHandler = function() {
	"use strict";

	var hooks = Meteor.require('hooks');

	var Handler = {
		registered: function(client, message) {
			var channels = {},
				network = Networks.findOne({_id: client._id});
			// firstly we grab the network record from the database

			// XXX - send our connect commands, things that the user defines
			// 		 nickserv identify or something

			for (var key in network.channels) {
				var channel = network.channels[key],
					chan = channel.channel,
					password = channel.password || '';

				ircFactory.send(client._id, 'join', [chan, password]);
				ircFactory.send(client._id, 'mode', [chan]);
				// request the mode aswell.. I thought this was sent out automatically anyway? Seems no.
			}
			// find our channels to automatically join from the network setup

			Networks.update({_id: client._id}, {$set: {
				'nick': message.nickname,
				'name': message.capabilities.network.name,
				'internal.status': networkManager.flags.connected,
				'internal.capabilities': message.capabilities
			}});
			//networkManager.changeStatus(client._id, networkManager.flags.connected);
			// commented this out because we do other changes to the network object here
			// so we don't use this but we use a straight update to utilise 1 query instead of 2

			networkManager.addTab(client, client.name, 'network');
			// add the tab
		},

		closed: function(client, message) {
			networkManager.changeStatus({_id: client._id, 'internal.status': {$ne: networkManager.closed}}, networkManager.flags.closed);
			// a bit of sorcery here, strictly speaking .changeStatus takes a networkId. But because of meteor's beauty
			// we can pass in an ID, or a selector. So instead of getting the status and checking it, we just do a mongo update
			// Whats happening is were looking for networks that match the id and their status has not been set to disconnected
			// which means someone has clicked disconnected, if not, just set it as closed (means we've disconnected for whatever reason)
		},

		failed: function(client, message) {
			networkManager.changeStatus(client._id, networkManager.flags.failed);
		},

		join: function(client, message) {
			var user = {
				username: message.username,
				hostname: message.hostname,
				nickname: message.nickname,
				modes: {}
			};
			// just a standard user object, although with a modes object aswell

			if (message.nickname == client.nick) {
				networkManager.addTab(client, message.channel, 'channel');
			}
			// if it's us joining a channel we'll mark it in internal.tabs

			channelManager.insertUsers(client._id, client.name, message.channel, [user]);

			eventManager.insertEvent(client, message, 'join');
			// event
		},

		part: function(client, message) {
			channelManager.removeUsers(client.name, message.channel, [message.nickname]);

			if (message.nickname == client.nickname) {
				networkManager.activeTab(client._id, message.channel, false);
			}
			// we're leaving, remove the tab

			eventManager.insertEvent(client, message, 'part');
		},

		kick: function(client, message) {
			channelManager.removeUsers(client.name, message.channel, [message.kicked]);

			if (message.nickname == client.nick) {
				networkManager.activeTab(client._id, message.channel, false);
			}
			// we're leaving, remove the tab

			eventManager.insertEvent(client, message, 'kick');
		},

		quit: function(client, message) {
			eventManager.insertEvent(client, message, 'quit');
			channelManager.removeUsers(client.name, [message.nickname]);
		},

		nick: function(client, message) {
			if (message.nickname == client.nick) {
				client.nickname = message.newnick;
				Networks.update({_id: client._id}, {$set: {nick: message.newnick}});
			}
			// update the nickname because its us changing our nick
			
			eventManager.insertEvent(client, message, 'nick');
			channelManager.updateUsers(client._id, client.name, [message.nickname], {nickname: message.newnick});
		},

		who: function(client, message) {
			var users = [],
				prefixes = _.invert(client.internal.capabilities.modes.prefixmodes);

			networkManager.addTab(client, message.channel, 'channel');
			// we'll update our internal channels cause we might be reconnecting after inactivity

			_.each(message.who, function(u) {
				var split = u.prefix.split('@'),
					mode = u.mode.replace(/[a-z0-9]/i, ''),
					user = {};

				user.username = split[0];
				user.hostname = split[1];
				user.nickname = u.nickname;
				user.modes = {};

				for (var i = 0, len = mode.length; i < len; i++) {
					var prefix = mode.charAt(i);
					user.modes[prefix] = prefixes[prefix];
				}

				users.push(user);
			});

			channelManager.insertUsers(client._id, client.name, message.channel, users, true);
		},

		names: function(client, message) {
			var channelUsers = ChannelUsers.find({network: client.name, channel: message.channel.toLowerCase()}),
				users = [],
				keys = [],
				regex = new RegExp('[' + Meteor.Helpers.escape(client.internal.capabilities.modes.prefixes) + ']', 'g');

			channelUsers.forEach(function(u) {
				keys.push(u.nickname);
			});

			for (var user in message.names) {
				users.push(message.names[user].replace(regex, ''));
			}
			// strip prefixes

			keys.sort();
			users.sort();

			if (!_.isEqual(keys, users)) {
				ircFactory.send(client._id, 'raw', ['WHO', message.channel]);
			}
			// different lists.. lets do a /WHO
		},

		mode: function(client, message) {
			channelManager.updateModes(client._id, client.internal.capabilities.modes, client.name, message.channel, message.mode);
		},

		mode_change: function(client, message) {
			channelManager.updateModes(client._id, client.internal.capabilities.modes, client.name, message.channel, message.mode);
			eventManager.insertEvent(client, message, 'mode');
		},

		topic: function(client, message) {
			channelManager.updateTopic(client.name, message.channel, message.topic, message.topicBy);
		},

		topic_change: function(client, message) {
			var split = message.topicBy.split(/[!@]/);

			message.nickname = split[0];
			message.username = split[1];
			message.hostname = split[2];
			// reform this object

			channelManager.updateTopic(client.name, message.channel, message.topic, message.topicBy);
			eventManager.insertEvent(client, message, 'topic');
		},

		privmsg: function(client, message) {
			eventManager.insertEvent(client, message, 'privmsg');
		},

		/*notice: function(client, message) {
			eventManager.insertEvent(client, message, 'notice');
		},*/
		// XXX - Change * target to be dumped in the server log

		ctcp_request: function(client, message) {
			if (message.type.toUpperCase() == 'VERSION') {
				var version = 'IRCAnywhere v' + application.smartjson.version + ' ' + application.smartjson.homepage;
				ircFactory.send(client._id, 'ctcp', [message.nickname, 'VERSION', version]);
			}

			eventManager.insertEvent(client, message, 'ctcp_request');
		}
	};

	return _.extend(Handler, hooks);
};