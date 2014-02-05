var _ = require('lodash'),
	hooks = require('hooks'),
	helper = require('../lib/helpers').Helpers;

/**
 * Formats an array of RAW IRC strings, taking off the :leguin.freenode.net 251 ricki- :
 * at the start, returns an array of strings with it removed
 *
 * @method 	_insert
 * @param 	{Array} raw
 * @private	
 * @return 	{Array}
 */
var _formatRaw = function(raw) {
	var output = [];
	raw.forEach(function(line) {
		var split = line.split(' ');
			split.splice(0, 3);
		var string = split.join(' ');
			string = (string.substr(0, 1) === ':') ? string.substr(1) : string;
		
		output.push(string);
	});

	return output;
};

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
	
	client.internal.capabilities = message.capabilities;
	// set this immediately so the other stuff works

	application.Networks.sync.update({_id: client._id}, {$set: {
		'nick': message.nickname,
		'name': message.capabilities.network.name,
		'internal.status': networkManager.flags.connected,
		'internal.capabilities': message.capabilities
	}});
	//networkManager.changeStatus({_id: client._id}, networkManager.flags.connected);
	// commented this out because we do other changes to the network object here
	// so we don't use this but we use a straight update to utilise 1 query instead of 2

	application.Tabs.sync.update({title: client.name, network: client._id}, {$set: {
		title: message.capabilities.network.name,
		target: message.capabilities.network.name,
		active: true
	}});
	// update the tab

	application.Tabs.sync.update({network: client._id}, {$set: {
		networkName: message.capabilities.network.name,
	}});
	// update any sub tabs

	eventManager.insertEvent(client, {
		nickname: message.nickname,
		time: new Date(new Date(message.time).getTime() - 15).toJSON(),
		message: _formatRaw(message.raw),
		raw: message.raw
	}, 'registered');
	// a bit of a hack here we'll spin the timestamp back 15ms to make sure it
	// comes in order, it's because we've gotta wait till we've recieved all the capab
	// stuff in irc-factory before we send it out, which can create a race condition
	// which causes lusers to be sent through first

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

	eventManager.insertEvent(client, {
		time: new Date().toJSON(),
		message: (message.reconnecting) ? 'Connection closed. Attempting reconnect number ' + message.attempts : 'You have disconnected.',
	}, 'closed');
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
	networkManager.changeStatus({_id: client._id}, networkManager.flags.failed);
	// mark tab as failed
	
	networkManager.activeTab(client, false);
	// now lets update the tabs to inactive

	eventManager.insertEvent(client, {
		time: new Date().toJSON(),
		message: 'Connection closed. Retry attempts exhausted.',
	}, 'closed');
}

/**
 * Handles an incoming lusers
 *
 * @method 	lusers
 * @param 	{Object} client
 * @param 	{Object} message
 * @extend 	true
 * @return 	void
 */
IRCHandler.prototype.lusers = function(client, message) {
	eventManager.insertEvent(client, {
		time: message.time,
		message: _formatRaw(message.raw),
		raw: message.raw
	}, 'lusers');
}

/**
 * Handles an incoming motd
 *
 * @method 	motd
 * @param 	{Object} client
 * @param 	{Object} message
 * @extend 	true
 * @return 	void
 */
IRCHandler.prototype.motd = function(client, message) {
	eventManager.insertEvent(client, {
		//time: new Date(new Date(message.time).getTime() - 15).toJSON(),
		time: message.time,
		message: _formatRaw(message.raw),
		raw: message.raw
	}, 'motd');
	// again spin this back 15ms to prevent a rare but possible race condition where
	// motd is the last thing that comes through, because we wait till we've recieved
	// it all before sending it out, javascripts async nature causes this.
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
		networkManager.addTab(client, message.channel, 'channel', true);
		ircFactory.send(client._id, 'mode', [message.channel]);
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
		socket = Users[client.internal.userId.toString()],
		prefixes = _.invert(client.internal.capabilities.modes.prefixmodes);

	networkManager.addTab(client, message.channel, 'channel');
	// we'll update our internal channels cause we might be reconnecting after inactivity

	for (var uid in message.who) {
		var u = message.who[uid],
			split = u.prefix.split('@'),
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
	}

	var inserts = channelManager.insertUsers(client._id, client.name, message.channel, users, true);

	if (socket) {
		socket.send('channelUsers', {data: inserts});
	}
	// burst emit these instead of letting the oplog tailer handle it, it's too heavy
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
 * Handles an incoming action
 *
 * @method action
 * @param 	{Object} client
 * @param 	{Object} message
 * @extend 	true
 * @return 	void
 */
IRCHandler.prototype.action = function(client, message) {
	eventManager.insertEvent(client, message, 'action');
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
IRCHandler.prototype.notice = function(client, message) {
	eventManager.insertEvent(client, message, 'notice');
}

/**
 * Handles an incoming usermode
 *
 * @method 	usermode
 * @param 	{Object} client
 * @param 	{Object} message
 * @extend 	true
 * @return 	void
 */
IRCHandler.prototype.usermode = function(client, message) {
	eventManager.insertEvent(client, message, 'usermode');
}

/**
 * Handles an incoming ctcp_response
 *
 * @method 	ctcp_response
 * @param 	{Object} client
 * @param 	{Object} message
 * @extend 	true
 * @return 	void
 */
IRCHandler.prototype.ctcp_response = function(client, message) {
	eventManager.insertEvent(client, message, 'ctcp_response');
}

/**
 * Handles an incoming ctcp request
 *
 * @method 	ctcp_request
 * @param 	{Object} client
 * @param 	{Object} message
 * @extend 	true
 * @return 	void
 */
IRCHandler.prototype.ctcp_request = function(client, message) {
	if (message.type.toUpperCase() == 'VERSION') {
		var version = 'IRCAnywhere v' + application.packagejson.version + ' ' + application.packagejson.homepage;
		ircFactory.send(client._id, 'ctcp', [message.nickname, 'VERSION', version]);
	}

	eventManager.insertEvent(client, message, 'ctcp_request');
}

/**
 * Handles an incoming unknown
 *
 * @method 	unknown
 * @param 	{Object} client
 * @param 	{Object} message
 * @extend 	true
 * @return 	void
 */
IRCHandler.prototype.unknown = function(client, message) {
	message.message = message.params.join(' ');
	eventManager.insertEvent(client, message, 'unknown');
}

/* XXX - Events TODO
 	
 	away 		-  maybe this should alter the network status?
 	unaway		-  ^
 	names 		-  kinda done, need to determine whether they've ran /names or not and show it as a model maybe
 	whois		- /--
 	links 		-/
 	list 		-| These need to be moved over from events
 	banlist 	-| and sent straight down the websocket pipe
 	invitelist 	-| to be parsed into a model window or something
 	exceptlist 	-| because we dont want to store this info
 	quietlist 	-\
 	invitelist	- \--

 */

exports.IRCHandler = _.extend(IRCHandler, hooks);