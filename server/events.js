EventManager = function() {
	"use strict";

	var _ = Meteor.require('underscore'),
		_insert = function(client, message, type, tab) {
		var output = {
			type: type,
			user: client.userId,
			tab: client.tabs[message.channel].key || client.key,
			message: message,
			read: false,
			extra: {
				highlight: false,
				prefix: ''
			}
		};

		Events.insert(output);
	};

	var Manager = {
		init: function() {
			Events.allow({
				update: function (userId, doc, fields, modifier) {	
					return doc.user === userId;
				},
				fetch: ['user']
			});
			// allow our events documents to be changed by us
		},

		insertEvent: function(client, message, type) {
			var self = this;

			if (type == 'nick' || type == 'quit') {
				var chans = ChannelUsers.find({network: client.network, nickname: message.nickname});
				// find the channel, we gotta construct a query (kinda messy)

				chans.forEach(function(chan) {
					message.channel = chan.channel;
					_insert(client, message, type, chan._id);
					// we're in here because the user either changing their nick
					// or quitting, exists in this channel, lets add it to the event
				});

				if (_.has(client.tabs, message.nickname)) {
					_insert(client, message, type, client.tabs[message.nickname]);
				}
				// these two types wont have a target, or a channel, so
				// we'll have to do some calculating to determine where we want them
				// we shall put them in channel and privmsg tab events
			} else {
				_insert(client, message, type, client.tabs[message.target] || client.key);
			}
		}
	};

	Manager.init();

	return Manager;
};