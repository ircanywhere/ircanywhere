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
	helper = require('../lib/helpers').Helpers,
	Q = require('q');

/**
 * Constructor, does nothing
 *
 * @class EventManager
 * @method EventManager
 * @return void
 */
function EventManager() {
	
}

/**
 * @member channelEvents A list of events relating to channels
 */
EventManager.prototype.channelEvents = ['join', 'part', 'kick', 'quit', 'nick', 'mode', 'topic', 'privmsg', 'action'];

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
	var self = this,
		deferred = Q.defer(),
		ours = (message.nickname === client.nick),
		channel = (message.channel && !message.target) ? message.channel : message.target,
		read = ours || client.clientConnected;

	force = force || false;
	user = user || false;

	if (!message.channel && !message.target) {
		channel = null;
	}
	// dont get the tab id anymore, because if the tab is removed and rejoined, the logs are lost
	// because the tab id is lost in the void. So we just refer to network and target now, target can also be null.

	if (user) {
		deferred.resolve(user);
	} else {
		application.db.findOne('channelUsers', {network: client._id, channel: channel, nickname: message.nickname}, function(err, doc) {
			if (err) {
				deferred.reject();
			} else {
				deferred.resolve(doc);
			}
		});
	}
	// get a channel user object if we've not got one

	deferred.promise
		.then(function(user) {
			var target = (_.indexOf(self.channelEvents, type) > -1 || (type === 'notice' && helper.isChannel(client, channel))) ? channel : '*';
				target = (force || !target) ? '*' : target.toLowerCase();
			// anything else goes in '*' so it's forwarded to the server log

			if (message.channel) {
				message.channel = message.channel.toLowerCase();
			}

			if (message.target) {
				message.target = message.target.toLowerCase();
			}
			// housekeeping for #ChannelNames

			var prefixObject = eventManager.getPrefix(client, user),
				output = {
					type: type,
					user: client.internal.userId,
					network: client._id,
					target: target,
					message: message,
					read: (type === 'action' || type === 'privmsg' || type === 'notice' || type === 'ctcp_request') ? read : true,
					extra: {
						self: (client.nick === message.nickname || client.nick === message.kicked),
						highlight: eventManager.determineHighlight(client, message, type, ours),
						prefix: prefixObject.prefix
					}
				};

			application.db.insert('events', output);
			// get the prefix, construct an output and insert it
		});
	// once we've got a valid user, continue
};

/**
 * Inserts an event into the backlog, takes a client and message object and a type
 * Usually 'privmsg' or 'join' etc.
 *
 * @method insertEvent
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object from `irc-message`
 * @param {String} type Event type
 * @param {Function} cb Callback function to be executed after insert
 * @return void
 */
EventManager.prototype.insertEvent = function(client, message, type, cb) {
	var self = this;

	if (type == 'nick' || type == 'quit') {
		application.db.find('channelUsers', {network: client._id, nickname: message.nickname}).toArray(function(err, userRecords) {
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

		_.each(client.internal.tabs, function(value) {
			if (value.target === message.nickname.toLowerCase()) {
				self._insert(client, message, type);
			}
		});
		// these two types wont have a target, or a channel, so
		// we'll have to do some calculating to determine where we want them
		// we shall put them in channel and privmsg tab events

		if (message.nickname.toLowerCase() === client.nick.toLowerCase()) {
			self._insert(client, message, type, null, true);
		}
		// we can also push it into the * backlog if it's us
	} else if (type === 'privmsg' || type === 'action') {
		var target = message.target.toLowerCase(),
			tab = client.internal.tabs[message.target.toLowerCase()];

		if (!tab && target === client.nick.toLowerCase()) {
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
};

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

	if (message.message.match(new RegExp('\\b' + helper.escape(client.nick) + '\\b', 'i'))) {
		return true;
	}
	// does this match our nick?

	// XXX - does this match our highlight words

	return false;
};

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

	for (var i = 0, len = sorted.length; i < len; i++) {
		var mode = sorted[i];
		switch (mode) {
			case 'q':
				return {prefix: client.internal.capabilities.modes.prefixmodes[mode], sort: 1};
			case 'a':
				return {prefix: client.internal.capabilities.modes.prefixmodes[mode], sort: 2};
			case 'o':
				return {prefix: client.internal.capabilities.modes.prefixmodes[mode], sort: 3};
			case 'h':
				return {prefix: client.internal.capabilities.modes.prefixmodes[mode], sort: 4};
			case 'v':
				return {prefix: client.internal.capabilities.modes.prefixmodes[mode], sort: 5};
		}
	}
	// loop through the modes in a normal for loop so we can return

	return {prefix: '', sort: 6};
};

/**
 * Gets the most recent event from the database by its type.
 *
 * @method getEventByType
 * @param {String} type Event type
 * @param {ObjectID} network Event network
 * @param {String} userId Id of the user
 * @returns {promise} Promise that resolves to event.
 */
EventManager.prototype.getEventByType = function (type, network, userId) {
	var deferred = Q.defer();

	application.db.find('events', {type: type, network: network, user: userId}).sort({'message.time': -1}).limit(1).nextObject(function(err, event) {
		if (err) {
			deferred.reject(err);
			return;
		}

		deferred.resolve(event);
	});

	return deferred.promise;
};

/**
 * Gets the message playback for an IRC server user since he was last seen.
 *
 * @method getUserPlayback
 * @param {ObjectID} network Network to get playback from
 * @param {String} userId Id of the user
 * @returns {promise} Promise that resolves to array of playback events.
 */
EventManager.prototype.getUserPlayback = function (network, userId) {
	var deferred = Q.defer();

	application.db.find('events', {read: false, network: network, user: userId})
		.sort({'message.time': 1}).toArray(function(err, events) {
		if (err) {
			deferred.reject(err);
			return;
		}

		deferred.resolve(events);

		application.db.update('events', {read: false, network: network, user: userId},
			{$set: {read: true}}, {multi: true},
			function (err) {
				if (err) {
					application.handleError(new Error(err));
				}
			});
		// Mark all as read
	});

	return deferred.promise;
};

EventManager.prototype = _.extend(EventManager.prototype, hooks);

exports.EventManager = EventManager;
