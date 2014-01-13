EventManager = function() {
	"use strict";

	var _ = require('lodash'),
		hooks = require('hooks'),
		Fiber = require('fibers'),
		_insert = function(client, message, type, user) {
			var network = client.name,
				channel = (message.channel && !message.target) ? message.channel : message.target,
				user = user || application.ChannelUsers.findOne({network: client.name, channel: channel, nickname: message.nickname});
			// get a channel user object if we've not got one

			if (!message.channel && !message.target) {
				var channel = null;
			}
			// dont get the tab id anymore, because if the tab is removed and rejoined, the logs are lost
			// because the tab id is lost in the void. So we just refer to network and target now, target can also be null.
			
			var prefixObject = Manager.getPrefix(client, user),
				output = {
					type: type,
					user: client.internal.userId,
					network: network,
					target: channel,
					message: message,
					read: false,
					extra: {
						self: (client.nick === message.nickname || client.nick === message.kicked) ? true : false,
						highlight: Manager.determineHighlight(client, message, type, (client.nick === message.nickname)),
						prefix: prefixObject.prefix
					}
				};

			application.Events.insert(output);
			// get the prefix, construct an output and insert it
		};

	var Manager = {
		init: function() {
			/*Meteor.publish('events', function() {
				return Events.find({user: this.userId});
			});

			Events.allow({
				update: function (userId, doc, fields, modifier) {	
					return doc.user === userId;
				},
				fetch: ['user']
			});*/
			// allow our events documents to be changed by us
			// XXX - Convert this to socket.io
		},

		insertEvent: function(client, message, type) {
			var self = this;

			if (type == 'nick' || type == 'quit') {
				var chans = application.ChannelUsers.find({network: client.name, nickname: message.nickname});
				// find the channel, we gotta construct a query (kinda messy)

				chans.forEach(function(chan) {
					message.channel = chan.channel;
					_insert(client, message, type, chan);
					// we're in here because the user either changing their nick
					// or quitting, exists in this channel, lets add it to the event
				});

				if (_.has(client.internal.tabs, message.nickname)) {
					_insert(client, message, type, chan);
				}
				// these two types wont have a target, or a channel, so
				// we'll have to do some calculating to determine where we want them
				// we shall put them in channel and privmsg tab events
			} else if (type == 'privmsg' || type == 'action') {
				var tab = client.internal.tabs[message.target];

				if (tab === undefined) {
					networkManager.addTab(client, message.nickname, 'query', false);
				}
				// create the tab if its undefined

				_insert(client, message, type);
			} else {
				_insert(client, message, type);
			}
		},

		determineHighlight: function(client, message, type, ours) {
			if (!ours || (type !== 'privmsg' && type !== 'action')) {
				return false;
			}

			var escape = function(text) {
				return text.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
			};

			if (message.message.match('(' + escape(client.nick) + ')')) {
				return true;
			}
			// does this match our nick?

			// XXX - does this match our highlight words

			return false;
		},

		getPrefix: function(client, user) {
			if (user === null || _.isEmpty(user.modes)) {
				return {prefix: '', sort: 6};
			}
			// empty object

			var keys = _.keys(client.internal.capabilities.modes.prefixmodes),
				values = _.values(user.modes),
				sorted = [];

			keys.forEach(function(key) {
				if (_.indexOf(values, key) > -1) {
					sorted.push(key);
				}
			});
			// sort modes in q, a, o, h, v order

			for (var i in sorted) {
				var mode = sorted[i];
				switch (mode) {
					case 'q':
						return {prefix: client.internal.capabilities.modes.prefixmodes[mode], sort: 1};
						break;
					case 'a':
						return {prefix: client.internal.capabilities.modes.prefixmodes[mode], sort: 2};
						break;
					case 'o':
						return {prefix: client.internal.capabilities.modes.prefixmodes[mode], sort: 3};
						break;
					case 'h':
						return {prefix: client.internal.capabilities.modes.prefixmodes[mode], sort: 4};
						break;
					case 'v':
						return {prefix: client.internal.capabilities.modes.prefixmodes[mode], sort: 5};
						break;
				}
			}
			// loop through the modes in a normal for loop so we can return

			return {prefix: '', sort: 6};
		}
	};

	Fiber(Manager.init).run();

	return _.extend(Manager, hooks);
};

exports.EventManager = EventManager;