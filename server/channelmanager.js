ChannelManager = function() {
	"use strict";

	var _ = Meteor.require('underscore');

	var Manager = {
		channel: {
			network: '',
			channel: '',
			topic: {},
			modes: '',
			users: {}
		},
		// a default channel object

		createChannel: function(network, channel) {
			var chan = _.clone(this.channel);
			// clone this.channel

			chan.network = network;
			chan.channel = channel.toLowerCase();

			chan._id = Channels.insert(chan);
			// insert into the db

			return chan || false;
		},

		getChannel: function(network, channel) {
			return Channels.findOne({network: network, channel: channel});
		},

		insertUsers: function(key, network, channel, users, force) {
			var force = force || false,
				channel = channel.toLowerCase(),
				update = {},
				chan = this.getChannel(network, channel);

			if (!chan) {
				var chan = this.createChannel(network, channel);
				// create the channel

				ircFactory.send(key, 'raw', ['WHO', channel]);
				// we also do a /WHO here because we don't have this channel.. We want something
				// a bit more detailed than the default NAMES reply
			}

			_.each(users, function(u) {
				var field = (force) ? u.nickname : 'users.' + u.nickname;
				update[field] = u;
			});
			// create an update record

			if (force) {
				Channels.update({network: network, channel: channel}, {$set: {users: update}});
			} else {
				Channels.update({network: network, channel: channel}, {$set: update});
			}
			// send the update out

			return chan._id;
		},

		removeUsers: function(network, channel, users) {
			var update = {},
				channel = (_.isArray(channel)) ? channel : channel.toLowerCase(),
				users = (_.isArray(channel)) ? channel : users;
			// basically we check if channel is an array, if it is we're being told to
			// jsut remove the user from the entire network (on quits etc)

			_.each(users, function(u) {
				update['users.' + u] = 1;
			});
			// create an update record

			if (_.isArray(channel)) {
				Channels.update({network: network}, {$unset: update});
			} else {
				Channels.update({network: network, channel: channel}, {$unset: update});
				// update

				if (Channels.findOne({network: network, channel: channel}).users.length == 0) {
					Channels.remove({network: network, channel: channel});
				}
				// check if the user list is empty
			}
			// send the update out
		},

		updateUsers: function(network, users, values) {
			var query = {network: network},
				update = {};

			_.each(users, function(u) {
				var s = {network: network};
					s['users.' + u] = {$exists: true};
				var q = _.extend(query, s),
					records = Channels.find(q);

				records.forEach(function (record) {
					var user = record.users[u],
						updated = _.extend(user, values);

					if ('nickname' in values) {
						record.users[values.nickname] = updated;
						delete record.users[u];
					} else {
						record.users[record.nickname] = updated;
					}

					Channels.update({network: network, channel: record.channel}, {$set: {users: record.users}});
					// update the record
				});
			});
			// this is hacky as hell I feel but it's getting done this way to
			// comply with all the other functions in this class
		},

		updateModes: function(capab, network, channel, mode) {
			var channel = channel.toLowerCase(),
				chan = this.getChannel(network, channel);

			if (!chan) {
				var chan = this.createChannel(network, channel);
				// create the channel
			}

			var parsedModes = modeParser.sortModes(capab, mode);
			// we're not arsed about the channel or network here

			chan.modes = modeParser.changeModes(capab, chan.modes, parsedModes);
			chan.users = modeParser.handleParams(capab, chan.users, parsedModes);
			// we need to attempt to update the record now with the new info

			Channels.update({network: network, channel: channel}, {$set: {users: chan.users, modes: chan.modes}});
			// update the record
		},

		updateTopic: function(network, channel, topic, setby) {
			var channel = channel.toLowerCase(),
				chan = this.getChannel(network, channel);

			if (!chan) {
				var chan = this.createChannel(network, channel);
				// create the channel
			}

			chan.topic.topic = topic;
			chan.topic.setter = setby || '';
			// updat the topic record

			Channels.update({network: network, channel: channel}, {$set: {topic: chan.topic}});
			// update the record
		}
	};

	return Manager;
};