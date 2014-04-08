/**
 * IRCAnywhere server/events.js
 *
 * @title EventManager
 * @copyright (c) 2013-2014 http://ircanywhere.com
 * @license GPL v2
 * @author Ricki Hastings
*/

var _ = require('lodash'),
	hooks = require('hooks'),
	helper = require('../lib/helpers').Helpers;

/**
 * Constructor, does nothing
 *
 * @class EventManager
 * @method EventManager
 * @return void
 */
function EventManager() {
	/**
	 * @member channelEvents A list of events relating to channels
	 */
	this.channelEvents = ['join', 'part', 'kick', 'quit', 'nick', 'mode', 'topic', 'privmsg', 'action'];
}

/**
 * Inserts an event into a backlog after all the checking has been done
 * this api is private and EventManager.insertEvent should be used instead
 *
 * @method _insert
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object from `irc-message`
 * @param {String} type Event type
 * @param {Object} [user] An optional user object
 * @param {Boolean} [force] An optional force boolean to force the event into the '*' status window
 * @return void
 */
EventManager.prototype._insert = function(client, message, type, user, force) {
	var self = this;

	fibrous.run(function() {
		var force = force || false,
			user = user || false,
			network = (client.name) ? client.name : client.server,
			ours = (message.nickname === client.nick),
			channel = (message.channel && !message.target) ? message.channel : message.target,
			user = user || application.ChannelUsers.sync.findOne({network: client.name, channel: channel, nickname: message.nickname});
		// get a channel user object if we've not got one

		if (!message.channel && !message.target) {
			var channel = null;
		}
		// dont get the tab id anymore, because if the tab is removed and rejoined, the logs are lost
		// because the tab id is lost in the void. So we just refer to network and target now, target can also be null.
		
		var target = (_.indexOf(self.channelEvents, type) > -1 || (type === 'notice' && helper.isChannel(client, channel))) ? channel : '*';
			target = (force) ? '*' : target;
		// anything else goes in '*' so it's forwarded to the server log

		var prefixObject = eventManager.getPrefix(client, user),
			output = {
				type: type,
				user: client.internal.userId,
				network: network,
				target: target,
				message: message,
				read: (type === 'action' || type === 'privmsg' || type === 'notice' || type === 'ctcp_request') ? (ours ? true : false) : true,
				extra: {
					self: (client.nick === message.nickname || client.nick === message.kicked) ? true : false,
					highlight: eventManager.determineHighlight(client, message, type, ours),
					prefix: prefixObject.prefix
				}
			};

		application.Events.insert(output, {safe: false});
		// get the prefix, construct an output and insert it
	});
}

/**
 * Inserts an event into the backlog, takes a client and message object and a type
 * Usually 'privmsg' or 'join' etc.
 *
 * @method insertEvent
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object from `irc-message`
 * @param {String} type Event type
 * @return void
 */
EventManager.prototype.insertEvent = function(client, message, type, cb) {
	var self = this;

	if (type == 'nick' || type == 'quit') {
		application.ChannelUsers.find({network: client.name, nickname: message.nickname}).toArray(function(err, userRecords) {
			if (err || !userRecords) {
				return;
			}

			userRecords.forEach(function(user) {
				if (!user) {
					return;
				}
				
				var cloned = _.clone(message);
				cloned.channel = user.channel;
				self._insert(client, cloned, type, user);
				// we're in here because the user either changing their nick
				// or quitting, exists in this channel, lets add it to the event
			});
		});

		_.each(client.internal.tabs, function(value, key) {
			if (value.target === message.nickname.toLowerCase()) {
				self._insert(client, message, type);
			}
		});
		// these two types wont have a target, or a channel, so
		// we'll have to do some calculating to determine where we want them
		// we shall put them in channel and privmsg tab events

		if (message.nickname === client.nick) {
			self._insert(client, message, type, null, true);
		}
		// we can also push it into the * backlog if it's us
	} else if (type == 'privmsg' || type == 'action') {
		var tab = client.internal.tabs[message.target];

		if (!tab && message.nickname !== client.nick) {
			networkManager.addTab(client, message.nickname, 'query', false);
		}
		// create the tab if its undefined

		self._insert(client, message, type);
	} else {
		self._insert(client, message, type);
	}

	if (cb) {
		cb();
	}
}

/**
 * Determine whether a message should be marked as a highlight or not for the specific
 * IRC client. Currently this does not support anything other than looking at their nickname.
 *
 * @method determineHighlight
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object from `irc-message`
 * @param {String} type Event type
 * @param {Boolean} ours Whether this message comes from this client
 * @return {Boolean} true or false
 */
EventManager.prototype.determineHighlight = function(client, message, type, ours) {
	if (ours || (type !== 'privmsg' && type !== 'action')) {
		return false;
	}

	if (message.message.match(new RegExp('(' + helper.escape(client.nick) + ')', 'i'))) {
		return true;
	}
	// does this match our nick?

	// XXX - does this match our highlight words

	return false;
}

/**
 * Gets the channel prefix for the irc client and the user object. A valid object returned is
 * in the format of: ::
 *
 *	{prefix: '+', sort: 5};
 * 
 * @method getPrefix
 * @param {Object} client A valid client object
 * @param {Object} user A valid user object
 * @return {Object} A valid prefix object
 */
EventManager.prototype.getPrefix = function(client, user) {
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

exports.EventManager = _.extend(EventManager, hooks);