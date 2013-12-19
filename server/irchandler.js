IRCHandler = function() {
	"use strict";

	var fs = Meteor.require('fs'),
		smartjson = JSON.parse(fs.readFileSync(application.config.assetPath + '/../smart.json'));

	var Handler = {
		registered: function(client, message) {
			var channels = {},
				network = Networks.findOne({_id: client.key});
			// firstly we grab the network record from the database

			// XXX - send our connect commands, things that the user defines
			// 		 nickserv identify or something

			for (var key in network.channels) {
				var channel = network.channels[key],
					chan = channel.channel,
					password = channel.password || '';

				ircFactory.send(client.key, 'raw', ['JOIN ' + chan + ' ' + password]);
				ircFactory.send(client.key, 'raw', ['MODE ' + chan]);
				// request the mode aswell.. I thought this was sent out automatically anyway? Seems no.
			}
			// find our channels to automatically join from the network setup

			client.capabilities = message.capabilities;
			client.network = message.capabilities.network.name;
			client.nickname = message.nickname;
			// update client record on the fly

			Networks.update({_id: client.key}, {$set: {
				'nick': message.nickname,
				'name': message.capabilities.network.name,
				'internal.status': networkManager.flags.connected,
				'internal.capabilities': message.capabilities
			}});
			//networkManager.changeStatus(client.key, networkManager.flags.connected);
			// commented this out because we do other changes to the network object here
			// so we don't use this but we use a straight update to utilise 1 query instead of 2

			networkManager.addTab(client, client.network, 'network', client.key);
			// add the tab
		},

		closed: function(client, message) {
			networkManager.changeStatus({_id: client.key, 'internal.status': {$ne: networkManager.closed}}, networkManager.flags.closed);
			// a bit of sorcery here, strictly speaking .changeStatus takes a networkId. But because of meteor's beauty
			// we can pass in an ID, or a selector. So instead of getting the status and checking it, we just do a mongo update
			// Whats happening is were looking for networks that match the id and their status has not been set to disconnected
			// which means someone has clicked disconnected, if not, just set it as closed (means we've disconnected for whatever reason)
		},

		failed: function(client, message) {
			networkManager.changeStatus(client.key, networkManager.flags.failed);
		},

		join: function(client, message) {
			var user = {
				username: message.username,
				hostname: message.hostname,
				nickname: message.nickname,
				modes: {}
			};
			// just a standard user object, although with a modes object aswell

			var id = channelManager.insertUsers(client.key, client.network, message.channel, [user]);

			if (message.nickname == client.nickname) {
				networkManager.addTab(client, message.channel, 'channel', id);
			}
			// if it's us joining a channel we'll mark it in internal.tabs

			channelManager.insertEvent(client, message, 'join');
			// event
		},

		part: function(client, message) {
			channelManager.removeUsers(client.network, message.channel, [message.nickname]);
			channelManager.insertEvent(client, message, 'part');
		},

		kick: function(client, message) {
			channelManager.removeUsers(client.network, message.channel, [message.kicked]);
			channelManager.insertEvent(client, message, 'kick');
		},

		quit: function(client, message) {
			channelManager.insertEvent(client, message, 'quit');
			channelManager.removeUsers(client.network, [message.nickname]);
		},

		nick: function(client, message) {
			if (message.nickname == client.nickname) {
				client.nickname = message.newnick;
				Networks.update({_id: client.key}, {$set: {nick: message.newnick}});
			}
			// update the nickname because its us changing our nick
			
			channelManager.insertEvent(client, message, 'nick');
			channelManager.updateUsers(client.network, [message.nickname], {nickname: message.newnick});
		},

		who: function(client, message) {
			var users = [],
				prefixes = _.invert(client.capabilities.modes.prefixmodes);

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

			var id = channelManager.insertUsers(client.key, client.network, message.channel, users, true);

			networkManager.addTab(client, message.channel, 'channel', id);
			// we'll update our internal channels cause we might be reconnecting after inactivity
		},

		names: function(client, message) {
			var channel = channelManager.getChannel(client.network, message.channel),
				users = [],
				regex = new RegExp('[' + Meteor.Helpers.escape(client.capabilities.modes.prefixes) + ']', 'g'),
				keys = _.keys(channel.users);

			for (var user in message.names) {
				users.push(message.names[user].replace(regex, ''));
			}
			// strip prefixes

			function compare(arrays) {
				return _.all(arrays, function(array) {
					return array.length == arrays[0].length && _.difference(array, arrays[0]).length == 0;
				});
			};

			if (!compare([keys, users])) {
				ircFactory.send(client.key, 'raw', ['WHO ' + message.channel]);
			}
			// different lists.. lets do a /WHO
		},

		mode: function(client, message) {
			channelManager.updateModes(client.capabilities.modes, client.network, message.channel, message.mode);
		},

		mode_change: function(client, message) {
			channelManager.updateModes(client.capabilities.modes, client.network, message.channel, message.mode);
			channelManager.insertEvent(client, message, 'mode');
		},

		topic: function(client, message) {
			channelManager.updateTopic(client.network, message.channel, message.topic, message.topicBy);
		},

		topic_change: function(client, message) {
			channelManager.updateModes(client.capabilities.modes, client.network, message.channel, message.mode);
			channelManager.insertEvent(client, message, 'topic');
		},

		privmsg: function(client, message) {
			channelManager.insertEvent(client, message, 'privmsg');
		},

		/*notice: function(client, message) {
			channelManager.insertEvent(client, message, 'notice');
		},*/
		// XXX - Change * target to be dumped in the server log

		ctcp_request: function(client, message) {
			if (message.type.toUpperCase() == 'VERSION') {
				var version = 'IRCAnywhere v' + smartjson.version + ' ' + smartjson.homepage;
				ircFactory.send(client.key, 'ctcp', [message.nickname, 'VERSION', version]);
			}
		}
	};

	return Handler;
};