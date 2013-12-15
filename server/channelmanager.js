var dependable = Meteor.require('dependable'),
    container = dependable.container(),
    _ = Meteor.require('underscore');

var ChannelManager = function() {
	"use strict";

	var Manager = {
		channel: {
			network: '',
			channel: '',
			topic: {},
			modes: {},
			users: {}
		},
		// a default channel object

		init: function() {

		},

		createChannel: function(network, channel) {
			var chan = _.clone(this.channel);
			// clone this.channel

			chan.network = network;
			chan.channel = channel;

			chan._id = Channels.insert(chan);
			// insert into the db

			return chan || false;
		},

		getChannel: function(network, channel) {
			return Channels.findOne({network: network, channel: channel});
		},

		insertUsers: function(key, network, channel, users) {
			var update = {},
				chan = this.getChannel(network, channel);

			if (!chan) {
				var chan = this.createChannel(network, channel);
				// create the channel

				Meteor.ircFactory.send(key, 'raw', ['WHO', channel]);
				// we also do a /WHO here because we don't have this channel.. We want something
				// a bit more detailed than the default NAMES reply
			}

			_.each(users, function(u) {
				update['users.' + u.nickname] = u;
			});
			// create an update record

			Channels.update({network: network, channel: channel}, {$set: update});
			// send the update out
		},

		removeUsers: function(key, network, channel, users) {
			var update = {};
			// just alter the db directly

			_.each(users, function(u) {
				update['users.' + u] = 1;
			});
			// create an update record

			Channels.update({network: network, channel: channel}, {$unset: update});
			// send the update out
		}
	};

	Manager.init();

	return Manager;
};

Meteor.channelManager = container.resolve(ChannelManager);