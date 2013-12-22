ChannelManager = function() {
	"use strict";

	var _ = Meteor.require('underscore');
	var getPublishedTabs = function(collection, uid, strict) {
		var strict = strict || false,
			networks = Networks.find({'internal.userId': uid}),
			ids = [];

		networks.forEach(function(network) {
			_.each(network.internal.tabs, function(tab) {
				if ('key' in tab && (strict && tab.type == 'channel')) {
					ids.push(tab.key);
				}
			});
		});
		// XXX - Look into this, maybe bad design? :/
		//       i cant think of a better way of doing it because tabs are stored in network.internal
		//       which is MUCH better than the previous implementation in the old ircanywhere..

		return collection.find({_id: {$in: ids}});
		// this is a private method not exposed outside of ChannelManager
		// which is just simply used to prevent code duplication in Meteor.publish()
		// it's basically a permission checker
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
				getPublishedTabs(Channels, uid, true);
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

				return ChannelUsers.find({$or: match});
			});

			Meteor.publish('tabs', function(uid) {
				getPublishedTabs(Tabs, uid);
			});

			Meteor.publish('events', function(uid) {
				return Events.find({});
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
				var chan = this.createChannel(network, channel);
				// create the channel

				ircFactory.send(key, 'raw', ['WHO', channel]);
				// we also do a /WHO here because we don't have this channel.. We want something
				// a bit more detailed than the default NAMES reply
			}

			_.each(users, function(u) {
				u.network = network;
				u.channel = channel;
				find.push(u.nickname);
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

				if (ChannelUsers.find({network: network, channel: channel}).count() == 0) {
					Channels.remove({network: network, channel: channel});
				}
				// check if the user list is empty
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
				var chan = this.createChannel(network, channel);
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
				var chan = this.createChannel(network, channel);
				// create the channel
			}

			chan.topic.topic = topic;
			chan.topic.setter = setby || '';
			// updat the topic record

			Channels.update({network: network, channel: channel}, {$set: {topic: chan.topic}});
			// update the record
		},

		insertEvent: function(client, message, type) {
			function insert(client, message, type, tab) {
				var output = {
					type: type,
					user: client.userId,
					tab: client.tabs[message.channel].key || client.key,
					message: message
				};

				Events.insert(output);
			}

			if (type == 'nick' || type == 'quit') {
				var chans = ChannelUsers.find({network: client.network, nickname: message.nickname});
				// find the channel, we gotta construct a query (kinda messy)

				chans.forEach(function(chan) {
					message.channel = chan.channel;
					insert(client, message, type, chan._id);
					// we're in here because the user either changing their nick
					// or quitting, exists in this channel, lets add it to the event
				});

				if (_.has(client.tabs, message.nickname)) {
					insert(client, message, type, client.tabs[message.nickname]);
				}
				// these two types wont have a target, or a channel, so
				// we'll have to do some calculating to determine where we want them
				// we shall put them in channel and privmsg tab events
			} else {
				insert(client, message, type, client.tabs[message.target] || client.key);
			}
		}
	};

	Manager.init();

	return Manager;
};