ChannelManager = function() {
	"use strict";

	var hooks = Meteor.require('hooks'),
		_getTabs = function(uid, type, collection) {
			var networks = Networks.find({'internal.userId': uid}),
				match = [];

			networks.forEach(function(network) {
				_.each(network.internal.tabs, function(tab) {
					if ('key' in tab && tab.type === type) {
						match.push(tab.key);
					}
				});
			});
			// XXX - As in getPublishedTabs also take a look at this.

			if (match.length === 0) {
				return false;
			} else {
				return collection.find({_id: {$in: match}});
			}
		};

	var Manager = {
		channel: {
			network: '',
			channel: '',
			topic: {},
			modes: ''
		},
		// a default channel object

		init: function() {
			Meteor.publish('channels', function(uid) {
				return _getTabs(uid, 'channel', Channels);
			});

			Meteor.publish('tabs', function(uid) {
				return _getTabs(uid, 'query', Tabs);
			});

			Meteor.publish('channelUsers', function(uid) {
				var networks = Networks.find({'internal.userId': uid}),
					match = [];

				networks.forEach(function(network) {
					_.each(network.internal.tabs, function(tab) {
						if ('key' in tab && tab.type == 'channel') {
							match.push({network: network.name, channel: tab.target});
						}
					});
				});
				// XXX - As in getPublishedTabs also take a look at this.

				if (match.length === 0) {
					return false;
				} else {
					return ChannelUsers.find({$or: match});
				}
			});

			Meteor.publish('events', function(uid) {
				return Events.find();
			});
		},

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
				find = [],
				chan = this.getChannel(network, channel);

			if (!chan) {
				chan = this.createChannel(network, channel);
				// create the channel
			}

			_.each(users, function(u) {
				u.network = network;
				u.channel = channel;
				find.push(u.nickname);

				if (u.nickname == Clients[key].nick) {
					Networks.update({_id: key}, {$set: {hostname: u.hostname}});
				}
				// update hostname
			});
			// turn this into an array of nicknames

			if (force) {
				ChannelUsers.remove({network: network, channel: channel});
			} else {
				ChannelUsers.remove({network: network, channel: channel, nickname: {$in: find}});
			}
			// ok so here we've gotta remove any users in the channel already
			// and all of them if we're being told to force the update

			_.each(users, function(u) {
				ChannelUsers.insert(u);
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
				ChannelUsers.remove({network: network, nickname: {$in: users}});
			} else {
				ChannelUsers.remove({network: network, channel: channel, nickname: {$in: users}});
				// update
			}
			// send the update out
		},

		updateUsers: function(network, users, values) {
			var update = {};

			_.each(users, function(u) {
				var s = {network: network, nickname: u},
					records = ChannelUsers.find(s);

				records.forEach(function (user) {
					var updated = _.extend(user, values);

					ChannelUsers.update(s, _.omit(updated, '_id'));
					// update the record
				});
			});
			// this is hacky as hell I feel but it's getting done this way to
			// comply with all the other functions in this class
		},

		updateModes: function(capab, network, channel, mode) {
			var channel = channel.toLowerCase(),
				chan = this.getChannel(network, channel),
				us = {};

			if (!chan) {
				chan = this.createChannel(network, channel);
				// create the channel
			}

			var users = ChannelUsers.find({network: network, channel: channel}),
				parsedModes = modeParser.sortModes(capab, mode);
			// we're not arsed about the channel or network here

			chan.modes = modeParser.changeModes(capab, chan.modes, parsedModes);
			// we need to attempt to update the record now with the new info

			Channels.update({network: network, channel: channel}, {$set: {modes: chan.modes}});
			// update the record

			users.forEach(function(u) {
				delete u._id;
				us[u.nickname] = u;
			});

			modeParser.handleParams(capab, us, parsedModes).forEach(function(u) {
				ChannelUsers.update({network: network, channel: channel, nickname: u.nickname}, u);
			});
			// update users now
		},

		updateTopic: function(network, channel, topic, setby) {
			var channel = channel.toLowerCase(),
				chan = this.getChannel(network, channel);

			if (!chan) {
				chan = this.createChannel(network, channel);
				// create the channel
			}

			chan.topic.topic = topic;
			chan.topic.setter = setby || '';
			// updat the topic record

			Channels.update({network: network, channel: channel}, {$set: {topic: chan.topic}});
			// update the record
		}
	};

	Manager.init();

	return _.extend(Manager, hooks);
};