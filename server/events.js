var _ = require('lodash'),
	hooks = require('hooks'),
	helper = require('../lib/helpers').Helpers;

var channelEvents = ['join', 'part', 'kick', 'quit', 'nick', 'mode', 'topic', 'privmsg', 'action'];

/**
 * Inserts an event into a backlog after all the checking has been done
 * this api is private and EventManager.insertEvent should be used instead
 *
 * @method 	_insert
 * @param 	{Object} client
 * @param 	{Object} message
 * @param 	{String} type
 * @param 	{Object} [optional] user
 * @private	
 * @return 	void
 */
var _insert = function(client, message, type, user, force) {
	fibrous.run(function() {
		var force = force || false,
			user = user || false,
			network = client.name,
			channel = (message.channel && !message.target) ? message.channel : message.target,
			user = user || application.ChannelUsers.sync.findOne({network: client.name, channel: channel, nickname: message.nickname});
		// get a channel user object if we've not got one

		if (!message.channel && !message.target) {
			var channel = null;
		}
		// dont get the tab id anymore, because if the tab is removed and rejoined, the logs are lost
		// because the tab id is lost in the void. So we just refer to network and target now, target can also be null.
		
		var target = (_.indexOf(channelEvents, type) > -1 || (type === 'notice' && helper.isChannel(client, channel))) ? channel : '*';
			target = (force) ? '*' : target;
		// anything else goes in '*' so it's forwarded to the server log

		var prefixObject = eventManager.getPrefix(client, user),
			output = {
				type: type,
				user: client.internal.userId,
				network: network,
				target: target,
				message: message,
				read: (type === 'action' || type === 'privmsg' || type === 'notice' || type === 'ctcp_request') ? ((message.nickname === client.nick) ? true : false) : true,
				extra: {
					self: (client.nick === message.nickname || client.nick === message.kicked) ? true : false,
					highlight: eventManager.determineHighlight(client, message, type, (client.nick === message.nickname)),
					prefix: prefixObject.prefix
				}
			};

		application.Events.sync.insert(output);
		// get the prefix, construct an output and insert it
	});
}

/**
 * Description
 *
 * @class 	EventManager
 * @method 	EventManager
 * @extend	false
 * @return 	void
 */
function EventManager() {

}

/**
 * Inserts an event into the backlog, takes a client and message object and a type
 * Usually 'privmsg' or 'join' etc.
 *
 * @method 	insertEvent
 * @param 	{Object} client
 * @param 	{Object} message
 * @param 	{String} type
 * @extend	true
 * @return 	void
 */
EventManager.prototype.insertEvent = function(client, message, type) {
	if (type == 'nick' || type == 'quit') {
		var chans = application.ChannelUsers.sync.find({network: client.name, nickname: message.nickname});
		// find the channel, we gotta construct a query (kinda messy)

		chans.each(function(err, chan) {
			if (err || chan === null) {
				return;
			}
			
			message.channel = chan.channel;
			_insert(client, message, type, chan);
			// we're in here because the user either changing their nick
			// or quitting, exists in this channel, lets add it to the event
		});

		if (_.has(client.internal.tabs, message.nickname)) {
			_insert(client, message, type);
		}
		// these two types wont have a target, or a channel, so
		// we'll have to do some calculating to determine where we want them
		// we shall put them in channel and privmsg tab events

		if (message.nickname === client.nick) {
			_insert(client, message, type, null, true);
		}
		// we can also push it into the * backlog if it's us
	} else if (type == 'privmsg' || type == 'action') {
		var tab = client.internal.tabs[message.target];

		if (!tab) {
			networkManager.addTab(client, message.nickname, 'query', false);
		}
		// create the tab if its undefined

		_insert(client, message, type);
	} else {
		_insert(client, message, type);
	}
}

/**
 * Description
 * @method 	determineHighlight
 * @param 	{} client
 * @param 	{} message
 * @param 	{} type
 * @param 	{} ours
 * @extend	true
 * @return 	{Boolean}
 */
EventManager.prototype.determineHighlight = function(client, message, type, ours) {
	if (!ours || (type !== 'privmsg' && type !== 'action')) {
		return false;
	}

	/**
	 * Description
	 * @method escape
	 * @param {} text
	 * @return CallExpression
	 */
	var escape = function(text) {
		return text.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
	};

	if (message.message.match('(' + escape(client.nick) + ')')) {
		return true;
	}
	// does this match our nick?

	// XXX - does this match our highlight words

	return false;
}

/**
 * Gets the prefix for the irc client and the user object.
 * 
 * @method 	getPrefix
 * @param 	{Object} client
 * @param 	{Object} user
 * @extend	true
 * @return 	{Object}
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