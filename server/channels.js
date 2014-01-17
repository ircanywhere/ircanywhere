ChannelManager = function() {
	"use strict";

	var _ = require('lodash'),
		hooks = require('hooks');

	var Manager = {
		channel: {
			network: '',
			channel: '',
			topic: {},
			modes: ''
		},
		// a default channel object

		getChannel: function(network, channel) {
			return application.Tabs.sync.findOne({network: network, title: channel});
		},

		insertUsers: function(key, network, channel, users, force) {
			var force = force || false,
				channel = channel.toLowerCase(),
				find = [],
				chan = this.getChannel(key, channel);

			_.each(users, function(u) {
				u.network = network;
				u.channel = channel;
				find.push(u.nickname);

				if (u.nickname == Clients[key].nick) {
					application.Networks.sync.update({_id: key}, {$set: {hostname: u.hostname}});
				}
				// update hostname
			});
			// turn this into an array of nicknames

			if (force) {
				application.ChannelUsers.sync.remove({network: network, channel: channel});
			} else {
				application.ChannelUsers.sync.remove({network: network, channel: channel, nickname: {$in: find}});
			}
			// ok so here we've gotta remove any users in the channel already
			// and all of them if we're being told to force the update

			_.each(users, function(u) {
				var prefix = eventManager.getPrefix(Clients[key], u);
				u.sort = prefix.sort;
				u.prefix = prefix.prefix;
				application.ChannelUsers.sync.insert(u);
			});
			// send the update out

			return chan._id;
		},

		removeUsers: function(network, channel, users) {
			var channel = (_.isArray(channel)) ? channel : channel.toLowerCase(),
				users = (_.isArray(channel)) ? channel : users;
			// basically we check if channel is an array, if it is we're being told to
			// jsut remove the user from the entire network (on quits etc)

			if (_.isArray(channel)) {
				application.ChannelUsers.sync.remove({network: network, nickname: {$in: users}});
			} else {
				application.ChannelUsers.sync.remove({network: network, channel: channel, nickname: {$in: users}});
				// update
			}
			// send the update out
		},

		updateUsers: function(key, network, users, values) {
			var update = {};

			_.each(users, function(u) {
				var s = {network: network, nickname: u},
					records = application.ChannelUsers.sync.find(s);

				records.each(function(err, user) {
					if (err || user === null) {
						return;
					}

					var updated = _.extend(user, values);
						updated.sort = eventManager.getPrefix(Clients[key], updated).sort;

					application.ChannelUsers.sync.update(s, _.omit(updated, '_id'));
					// update the record
				});
			});
			// this is hacky as hell I feel but it's getting done this way to
			// comply with all the other functions in this class
		},

		updateModes: function(key, capab, network, channel, mode) {
			var channel = channel.toLowerCase(),
				chan = this.getChannel(key, channel),
				us = {};

			var users = application.ChannelUsers.sync.findOne({network: network, channel: channel}),
				parsedModes = modeParser.sortModes(capab, mode);
			// we're not arsed about the channel or network here

			var modes = modeParser.changeModes(capab, chan.modes, parsedModes);
			// we need to attempt to update the record now with the new info

			application.Tabs.sync.update({network: key, title: channel}, {$set: {modes: modes}});
			// update the record

			users.forEach(function(u) {
				delete u._id;
				us[u.nickname] = u;
			});

			modeParser.handleParams(capab, us, parsedModes).forEach(function(u) {
				var prefix = eventManager.getPrefix(Clients[key], u);
				u.sort = prefix.sort;
				u.prefix = prefix.prefix;
				
				application.ChannelUsers.sync.update({network: network, channel: channel, nickname: u.nickname}, u);
			});
			// update users now
		},

		updateTopic: function(key, channel, topic, setby) {
			var channel = channel.toLowerCase(),
				chan = this.getChannel(key, channel);

			var topic = {
				topic: topic,
				setter: setby || ''
			};
			// updat the topic record

			application.Tabs.sync.update({network: key, title: channel}, {$set: {topic: topic}});
			// update the record
		}
	};

	return _.extend(Manager, hooks);
};

exports.ChannelManager = ChannelManager;