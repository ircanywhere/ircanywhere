var _ = require('lodash'),
	hooks = require('hooks'),
	helper = require('../lib/helpers').Helpers;

/**
 * The object responsible for handling an event from IRCFactory
 * none of these should be called directly, however they can be hooked onto
 * or have their actions prevented or replaced. The function names equal directly
 * to irc-factory events and are case sensitive to them.
 *
 * @class	IRCHandler
 * @method 	IRCHandler
 * @return 	void
 */
function IRCHandler() {

}

/**
 * Handles a registered client
 *
 * @method 	registered
 * @param 	{Object} client
 * @param 	{Object} message
 * @extend 	true
 * @return 	void
 */
IRCHandler.prototype.registered = function(client, message) {
	var channels = {};
	
	// XXX - send our connect commands, things that the user defines
	// 		 nickserv identify or something

	for (var key in client.channels) {
		var channel = client.channels[key],
			chan = channel.channel,
			password = channel.password || '';

		ircFactory.send(client._id, 'join', [chan, password]);
		ircFactory.send(client._id, 'mode', [chan]);
		// request the mode aswell.. I thought this was sent out automatically anyway? Seems no.
	}
	// find our channels to automatically join from the network setup

	application.Networks.sync.update({_id: client._id}, {$set: {
		'nick': message.nickname,
		'name': message.capabilities.network.name,
		'internal.status': networkManager.flags.connected,
		'internal.capabilities': message.capabilities
	}});
	//networkManager.changeStatus(client._id, networkManager.flags.connected);
	// commented this out because we do other changes to the network object here
	// so we don't use this but we use a straight update to utilise 1 query instead of 2

	networkManager.addTab(client, client.name, 'network', true);
	// add the tab
}

/**
 * Handles a closed connection
 *
 * @method closed
 * @param 	{Object} client
 * @param 	{Object} message
 * @extend 	true
 * @return 	void
 */
IRCHandler.prototype.closed = function(client, message) {
	networkManager.changeStatus({_id: client._id, 'internal.status': {$ne: networkManager.closed}}, networkManager.flags.closed);
	// Whats happening is were looking for networks that match the id and their status has not been set to disconnected
	// which means someone has clicked disconnected, if not, just set it as closed (means we've disconnected for whatever reason)

	networkManager.activeTab(client, false);
	// now lets update the tabs to inactive
}

/**
 * Handles a failed event, which is emitted when the retry attempts are exhaused
 *
 * @method failed
 * @param 	{Object} client
 * @param 	{Object} message
 * @extend 	true
 * @return 	void
 */
IRCHandler.prototype.failed = function(client, message) {
	networkManager.changeStatus(client._id, networkManager.flags.failed);
	// mark tab as failed
	
	networkManager.activeTab(client, false);
	// now lets update the tabs to inactive
}

/**
 * Handles an incoming join
 *
 * @method join
 * @param 	{Object} client
 * @param 	{Object} message
 * @extend 	true
 * @return 	void
 */
IRCHandler.prototype.join = function(client, message) {
	var user = {
		username: message.username,
		hostname: message.hostname,
		nickname: message.nickname,
		modes: {}
	};
	// just a standard user object, although with a modes object aswell

	if (message.nickname == client.nick) {
		ircFactory.send(client._id, 'mode', [message.channel]);
		networkManager.addTab(client, message.channel, 'channel', true);
	}
	// if it's us joining a channel we'll mark it in internal.tabs

	channelManager.insertUsers(client._id, client.name, message.channel, [user]);

	eventManager.insertEvent(client, message, 'join');
	// event
}

/**
 * Handles an incoming part
 *
 * @method part
 * @param 	{Object} client
 * @param 	{Object} message
 * @extend 	true
 * @return 	void
 */
IRCHandler.prototype.part = function(client, message) {
	channelManager.removeUsers(client.name, message.channel, [message.nickname]);

	if (message.nickname == client.nick) {
		networkManager.activeTab(client, message.channel, false);
	}
	// we're leaving, mark the tab as inactive

	eventManager.insertEvent(client, message, 'part');
}

/**
 * Handles an incoming kick
 *
 * @method kick
 * @param 	{Object} client
 * @param 	{Object} message
 * @extend 	true
 * @return 	void
 */
IRCHandler.prototype.kick = function(client, message) {
	channelManager.removeUsers(client.name, message.channel, [message.kicked]);

	if (message.kicked == client.nick) {
		networkManager.activeTab(client, message.channel, false);
	}
	// we're leaving, remove the tab

	eventManager.insertEvent(client, message, 'kick');
}

/**
 * Handles an incoming quit
 *
 * @method quit
 * @param 	{Object} client
 * @param 	{Object} message
 * @extend 	true
 * @return 	void
 */
IRCHandler.prototype.quit = function(client, message) {
	eventManager.insertEvent(client, message, 'quit');
	channelManager.removeUsers(client.name, [message.nickname]);
}

/**
 * Handles an incoming nick change
 *
 * @method nick
 * @param 	{Object} client
 * @param 	{Object} message
 * @extend 	true
 * @return 	void
 */
IRCHandler.prototype.nick = function(client, message) {
	if (message.nickname == client.nick) {
		Networks.sync.update({_id: client._id}, {$set: {nick: message.newnick}});
	}
	// update the nickname because its us changing our nick

	if (_.has(client.internal.tabs, message.nickname)) {
		var mlower = message.nickname.toLowerCase();
		application.Tabs.sync.update({user: client.internal.userId, network: client._id, target: mlower}, {$set: {title: message.nickname, target: mlower, url: client.url + '/' + mlower}});
	}
	// is this a client we're chatting to whos changed their nickname?
	
	eventManager.insertEvent(client, message, 'nick');
	channelManager.updateUsers(client._id, client.name, [message.nickname], {nickname: message.newnick});
}

/**
 * Handles an incoming who
 *
 * @method who
 * @param 	{Object} client
 * @param 	{Object} message
 * @extend 	true
 * @return 	void 
 */
IRCHandler.prototype.who = function(client, message) {
	var users = [],
		prefixes = _.invert(client.internal.capabilities.modes.prefixmodes);

	networkManager.addTab(client, message.channel, 'channel');
	// we'll update our internal channels cause we might be reconnecting after inactivity

	_.each(message.who, function(u) {
		var split = u.prefix.split('@'),
			mode = u.mode.replace(/[a-z0-9]/i, ''),
			user = {};

		user.username = split[0];
		user.hostname = split[1];
		user.nickname = u.nickname;
		user.modes = {};

		for (var i = 0, len = mode.length; i < len; i++) {
			var prefix = mode.charAt(i);
			user.modes[prefix] = prefixes[prefix];
		}
		// set the modes

		user.prefix = eventManager.getPrefix(client, user).prefix;
		// set the current most highest ranking prefix

		users.push(user);
	});

	channelManager.insertUsers(client._id, client.name, message.channel, users, true);
}

/**
 * Handles an incoming names
 *
 * @method names
 * @param 	{Object} client
 * @param 	{Object} message
 * @extend 	true
 * @return 	void
 */
IRCHandler.prototype.names = function(client, message) {
	var channelUsers = application.ChannelUsers.sync.find({network: client.name, channel: message.channel.toLowerCase()}).sync.toArray(),
		users = [],
		keys = [],
		regex = new RegExp('[' + helper.escape(client.internal.capabilities.modes.prefixes) + ']', 'g');

	channelUsers.forEach(function(u) {
		keys.push(u.nickname);
	});

	for (var user in message.names) {
		users.push(message.names[user].replace(regex, ''));
	}
	// strip prefixes

	keys.sort();
	users.sort();

	if (!_.isEqual(keys, users)) {
		ircFactory.send(client._id, 'raw', ['WHO', message.channel]);
	}
	// different lists.. lets do a /WHO
}

/**
 * Handles an incoming mode notify
 *
 * @method mode
 * @param 	{Object} client
 * @param 	{Object} message
 * @extend 	true
 * @return 	void
 */
IRCHandler.prototype.mode = function(client, message) {
	channelManager.updateModes(client._id, client.internal.capabilities.modes, client.name, message.channel, message.mode);
}

/**
 * Handles an incoming mode change
 *
 * @method mode_change
 * @param {} client
 * @param {} message
 * @return 
 */
IRCHandler.prototype.mode_change = function(client, message) {
	channelManager.updateModes(client._id, client.internal.capabilities.modes, client.name, message.channel, message.mode);
	eventManager.insertEvent(client, message, 'mode');
}

/**
 * Handles an incoming topic notify
 *
 * @method topic
 * @param 	{Object} client
 * @param 	{Object} message
 * @extend 	true
 * @return 	void
 */
IRCHandler.prototype.topic = function(client, message) {
	channelManager.updateTopic(client._id, message.channel, message.topic, message.topicBy);
}

/**
 * Handles an incoming topic change
 *
 * @method topic_change
 * @param 	{Object} client
 * @param 	{Object} message
 * @extend 	true
 * @return 	void
 */
IRCHandler.prototype.topic_change = function(client, message) {
	var split = message.topicBy.split(/[!@]/);

	message.nickname = split[0];
	message.username = split[1];
	message.hostname = split[2];
	// reform this object

	channelManager.updateTopic(client._id, message.channel, message.topic, message.topicBy);
	eventManager.insertEvent(client, message, 'topic');
}

/**
 * Handles an incoming privmsg
 *
 * @method privmsg
 * @param 	{Object} client
 * @param 	{Object} message
 * @extend 	true
 * @return 	void
 */
IRCHandler.prototype.privmsg = function(client, message) {
	eventManager.insertEvent(client, message, 'privmsg');
}

/**
 * Handles an incoming notice
 *
 * @method 	notice
 * @param 	{Object} client
 * @param 	{Object} message
 * @extend 	true
 * @return 	void
 */
/*IRCHandler.prototype.notice = function(client, message) {
	eventManager.insertEvent(client, message, 'notice');
}*/
// XXX - Change * target to be dumped in the server log

/**
 * Handles an incoming ctcp request
 *
 * @method ctcp_request
 * @param 	{Object} client
 * @param 	{Object} message
 * @extend 	true
 * @return 	void
 */
IRCHandler.prototype.ctcp_request = function(client, message) {
	if (message.type.toUpperCase() == 'VERSION') {
		var version = 'IRCAnywhere v' + application.smartjson.version + ' ' + application.smartjson.homepage;
		ircFactory.send(client._id, 'ctcp', [message.nickname, 'VERSION', version]);
	}

	eventManager.insertEvent(client, message, 'ctcp_request');
}

exports.IRCHandler = _.extend(IRCHandler, hooks);