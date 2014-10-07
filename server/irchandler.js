/**
 * IRCAnywhere server/irchandler.js
 *
 * @title IRCHandler
 * @copyright (c) 2013-2014 http://ircanywhere.com
 * @license GPL v2
 * @author Ricki Hastings
 */

var _ = require('lodash'),
	queue = require('redmark'),
	hooks = require('hooks'),
	helper = require('../lib/helpers').Helpers;

/**
 * The object responsible for handling an event from IRCFactory
 * none of these should be called directly, however they can be hooked onto
 * or have their actions prevented or replaced. The function names equal directly
 * to irc-factory events and are case sensitive to them.
 *
 * @class IRCHandler
 * @method IRCHandler
 * @return void
 */
function IRCHandler() {
	this.queueId = queue.seed(function(id, chan) {
		ircFactory.send(id, 'raw', ['WHO', chan]);
	}, {time: 1000, total: 10, max: 1000});
	// rate limit /who call
}

/**
 * @member {Array} blacklisted An array of blacklisted commands which should be ignored
 */
IRCHandler.prototype.blacklisted = ['PING', 'RPL_CREATIONTIME'];

/**
 * Formats an array of RAW IRC strings, taking off the :leguin.freenode.net 251 ricki- :
 * at the start, returns an array of strings with it removed
 *
 * @method _formatRaw
 * @param {Array} raw An array of raw IRC strings to format
 * @return {Array} A formatted array of the inputted strings
 */
IRCHandler.prototype._formatRaw = function(raw) {
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
 * Handles the connecting event from `irc-factory` 
 *
 * @method opened
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void
 */
IRCHandler.prototype.connecting = function(client, message) {
	application.Networks.update({_id: client._id}, {$set: {
		'internal.status': networkManager.flags.connecting
	}}, {safe: false});

	networkManager.activeTab(client, false);
	// update tabs etc as connecting

	if (message.localPort) {
		IdentdCache[message.localPort] = message;
	}
	// have we got a local port yet?
};

/**
 * Handles the opened event from `irc-factory` which just tells us what localPort and any other
 * information relating to the client so we can make sure the identd server is working.
 *
 * @method opened
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void
 */
IRCHandler.prototype.opened = function(client, message) {
	if (!application.config.identd.enable) {
		return;
	}
	// not enabled, don't fill the cache if it isn't needed

	if (!message.username || !message.port || !message.localPort) {
		return;
	}
	// we need to make sure we've got all our required items

	IdentdCache[message.localPort] = message;
	delete client.forcedDisconnect;
};

/**
 * Handles the registered event, this will only ever be called when an IRC connection has been
 * fully established and we've recieved the `registered` events. This means when we reconnect to
 * an already established connection we won't get this event again.
 *
 * @method registered
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void
 */
IRCHandler.prototype.registered = function(client, message) {
	client.internal.capabilities = message.capabilities;
	// set this immediately so the other stuff works

	application.Networks.update({_id: client._id}, {$set: {
		nick: message.nickname,
		name: message.capabilities.network.name,
		'internal.status': networkManager.flags.connected,
		'internal.capabilities': message.capabilities
	}}, {safe: false});
	//networkManager.changeStatus({_id: client._id}, networkManager.flags.connected);
	// commented this out because we do other changes to the network object here
	// so we don't use this but we use a straight update to utilise 1 query instead of 2

	application.Tabs.update({target: client.name.toLowerCase(), network: client._id}, {$set: {
		title: message.capabilities.network.name,
		target: message.capabilities.network.name.toLowerCase(),
		active: true
	}}, {multi: true, safe: false});
	// update the tab

	application.Tabs.update({network: client._id, type: {$ne: 'channel'}}, {$set: {
		networkName: message.capabilities.network.name,
		active: true
	}}, {multi: true, safe: false});
	// update any sub tabs that are not channels

	eventManager.insertEvent(client, {
		nickname: message.nickname,
		time: new Date(new Date(message.time).getTime() - 15).toJSON(),
		message: this._formatRaw(message.raw),
		raw: message.raw
	}, 'registered', function() {
		// a bit of a hack here we'll spin the timestamp back 15ms to make sure it
		// comes in order, it's because we've gotta wait till we've recieved all the capab
		// stuff in irc-factory before we send it out, which can create a race condition
		// which causes lusers to be sent through first

		// XXX - send our connect commands, things that the user defines
		// 		 nickserv identify or something

		_.each(client.channels, function(channel) {
			if (channel.channel.trim() !== '') {
				channelManager.queueJoin(client._id, channel.channel, channel.password || '');
			}
		});
		// find our channels to automatically join from the network setup
	});
};

/**
 * Handles a closed connection
 *
 * @method closed
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void
 */
IRCHandler.prototype.closed = function(client, message) {
	networkManager.changeStatus({_id: client._id, 'internal.status': {$ne: networkManager.flags.disconnected}}, networkManager.flags.closed);
	// Whats happening is were looking for networks that match the id and their status has not been set to disconnected
	// which means someone has clicked disconnected, if not, just set it as closed (means we've disconnected for whatever reason)

	networkManager.activeTab(client, false);
	// now lets update the tabs to inactive

	eventManager.insertEvent(client, {
		time: new Date().toJSON(),
		message: (message.reconnecting) ? 'Connection closed. Attempting reconnect number ' + message.attempts : 'You have disconnected.',
	}, networkManager.flags.closed);

	if (!message.reconnecting) {
		ircFactory.destroy(client._id, false);
	}
	// destroy the client if we're not coming back
};

/**
 * Handles a failed event, which is emitted when the retry attempts are exhaused
 *
 * @method failed
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void
 */
IRCHandler.prototype.failed = function(client) {
	networkManager.changeStatus({_id: client._id}, networkManager.flags.failed);
	// mark tab as failed
	
	networkManager.activeTab(client, false);
	// now lets update the tabs to inactive

	eventManager.insertEvent(client, {
		time: new Date().toJSON(),
		message: 'Connection closed. Retry attempts exhausted.',
	}, networkManager.flags.closed);

	ircFactory.destroy(client._id, false);
	// destroy the client
};

/**
 * Handles an incoming lusers event
 *
 * @method lusers
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void
 */
IRCHandler.prototype.lusers = function(client, message) {
	eventManager.insertEvent(client, {
		time: message.time,
		message: this._formatRaw(message.raw),
		raw: message.raw
	}, 'lusers');
};

/**
 * Handles an incoming motd event
 *
 * @method motd
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void
 */
IRCHandler.prototype.motd = function(client, message) {
	eventManager.insertEvent(client, {
		time: message.time,
		message: this._formatRaw(message.raw),
		raw: message.raw
	}, 'motd');
	// again spin this back 15ms to prevent a rare but possible race condition where
	// motd is the last thing that comes through, because we wait till we've recieved
	// it all before sending it out, javascripts async nature causes this.
};

/**
 * Handles an incoming join event
 *
 * @method join
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void
 */
IRCHandler.prototype.join = function(client, message) {
	if (!message.username || !message.hostname || !message.nickname || !message.channel) {
		return false;
	}

	var user = {
		username: message.username,
		hostname: message.hostname,
		nickname: message.nickname,
		modes: {}
	};
	// just a standard user object, although with a modes object aswell

	if (message.nickname === client.nick) {
		networkManager.addTab(client, message.channel, 'channel', true);
		// add tab

		ircFactory.send(client._id, 'mode', [message.channel]);
		// request modes

		insertEvent();
		// insert join event
	} else {
		channelManager.insertUsers(client._id, message.channel, [user])
			.then(insertEvent);
	}
	// if it's us joining a channel we'll create a tab for it and request a mode

	function insertEvent() {
		eventManager.insertEvent(client, message, 'join');
	}
};

/**
 * Handles an incoming part event
 *
 * @method part
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void
 */
IRCHandler.prototype.part = function(client, message) {
	if (!message.username || !message.hostname || !message.nickname || !message.channel) {
		return false;
	}

	eventManager.insertEvent(client, message, 'part', function() {
		channelManager.removeUsers(client._id, message.channel, [message.nickname]);

		if (message.nickname === client.nick) {
			networkManager.activeTab(client, message.channel, false);
		}
		// we're leaving, mark the tab as inactive
	});
};

/**
 * Handles an incoming kick event
 *
 * @method kick
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void
 */
IRCHandler.prototype.kick = function(client, message) {
	if (!message.username || !message.hostname || !message.nickname || !message.channel || !message.kicked) {
		return false;
	}

	eventManager.insertEvent(client, message, 'kick', function() {
		channelManager.removeUsers(client._id, message.channel, [message.kicked]);

		if (message.kicked === client.nick) {
			networkManager.activeTab(client, message.channel, false);
		}
		// we're leaving, remove the tab
	});
};

/**
 * Handles an incoming quit event
 *
 * @method quit
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void
 */
IRCHandler.prototype.quit = function(client, message) {
	if (!message.username || !message.hostname || !message.nickname) {
		return false;
	}

	eventManager.insertEvent(client, message, 'quit', function() {
		channelManager.removeUsers(client._id, [message.nickname]);
	});
};

/**
 * Handles an incoming nick change event
 *
 * @method nick
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void
 */
IRCHandler.prototype.nick = function(client, message) {
	if (!message.username || !message.hostname || !message.nickname || !message.newnick) {
		return false;
	}

	var mlower = message.nickname.toLowerCase();
	if (mlower === client.nick.toLowerCase()) {
		application.Networks.update({_id: client._id}, {$set: {nick: message.newnick}}, {safe: false});
	}
	// update the nickname because its us changing our nick
	
	var mlower = message.nickname.toLowerCase();
	if (_.has(client.internal.tabs, mlower)) {
		application.Tabs.update({user: client.internal.userId, network: client._id, target: mlower}, {$set: {title: message.nickname, target: mlower, url: client.url + '/' + mlower}}, {safe: false});
	}
	// is this a client we're chatting to whos changed their nickname?
	
	eventManager.insertEvent(client, message, 'nick', function() {
		channelManager.updateUsers(client._id, [message.nickname], {nickname: message.newnick});
	});
};

/**
 * Handles an incoming who event
 *
 * @method who
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void 
 */
IRCHandler.prototype.who = function(client, message) {
	if (!message.who || !message.channel) {
		return false;
	}

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
		// normal for loop here cause we're just iterating a string, other cases I would use
		// _.each()

		user.prefix = eventManager.getPrefix(client, user).prefix;
		// set the current most highest ranking prefix

		users.push(user);
	});

	channelManager.insertUsers(client._id, message.channel, users, true)
		.then(function(inserts) {
			rpcHandler.push(client.internal.userId, 'channelUsers', inserts);
			// burst emit these instead of letting the oplog tailer handle it, it's too heavy
		});
};

/**
 * Handles an incoming names event
 *
 * @method names
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void
 */
IRCHandler.prototype.names = function(client, message) {
	var self = this;

	if (!message.names || !message.channel) {
		return false;
	}

	application.ChannelUsers.find({network: client._id, channel: message.channel.toLowerCase()}).toArray(function(err, channelUsers) {
		if (err || !channelUsers) {
			return false;
		}

		var users = [],
			keys = [],
			prefixes = helper.exists(client, 'internal.capabilities.modes.prefixes') || '@+',
			regex = new RegExp('[' + helper.escape(prefixes) + ']', 'g');

		channelUsers.forEach(function(u) {
			keys.push(u.nickname);
		});

		_.each(message.names, function(user) {
			users.push(user.replace(regex, ''));
		});
		// strip prefixes

		keys.sort();
		users.sort();

		if (!_.isEqual(keys, users) && message.channel !== '*') {
			queue.add(self.queueId, [client._id, message.channel]);
		}
		// different lists.. lets do a /WHO
	});
};

/**
 * Handles an incoming mode notify event
 *
 * @method mode
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void
 */
IRCHandler.prototype.mode = function(client, message) {
	if (!message.mode || !message.channel) {
		return false;
	}

	channelManager.updateModes(client._id, client.internal.capabilities.modes, message.channel, message.mode);
};

/**
 * Handles an incoming mode change event
 *
 * @method mode_change
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return 
 */
IRCHandler.prototype.mode_change = function(client, message) {
	if (!message.username || !message.hostname || !message.nickname || !message.mode || !message.channel) {
		return false;
	}

	eventManager.insertEvent(client, message, 'mode', function() {
		channelManager.updateModes(client._id, client.internal.capabilities.modes, message.channel, message.mode);
	});
};

/**
 * Handles an incoming topic notify event
 *
 * @method topic
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void
 */
IRCHandler.prototype.topic = function(client, message) {
	if (!message.topic || !message.topicBy || !message.channel) {
		return false;
	}

	var split = message.topicBy.split(/[!@]/);

	message.nickname = split[0];
	message.username = split[1];
	message.hostname = split[2];
	// reform this object

	eventManager.insertEvent(client, message, 'topic', function() {
		channelManager.updateTopic(client._id, message.channel, message.topic, message.topicBy);
	});
};

/**
 * Handles an incoming topic change event
 *
 * @method topic_change
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void
 */
IRCHandler.prototype.topic_change = function(client, message) {
	if (!message.topic || !message.topicBy || !message.channel) {
		return false;
	}

	var split = message.topicBy.split(/[!@]/);

	message.nickname = split[0];
	message.username = split[1];
	message.hostname = split[2];
	// reform this object

	eventManager.insertEvent(client, message, 'topic_change', function() {
		channelManager.updateTopic(client._id, message.channel, message.topic, message.topicBy);
	});
};

/**
 * Handles an incoming privmsg event
 *
 * @method privmsg
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void
 */
IRCHandler.prototype.privmsg = function(client, message) {
	if (!message.username || !message.hostname || !message.nickname || !message.target || !message.message) {
		return false;
	}

	eventManager.insertEvent(client, message, 'privmsg');
};

/**
 * Handles an incoming action event
 *
 * @method action
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void
 */
IRCHandler.prototype.action = function(client, message) {
	if (!message.username || !message.hostname || !message.nickname || !message.target || !message.message) {
		return false;
	}

	eventManager.insertEvent(client, message, 'action');
};

/**
 * Handles an incoming notice event
 *
 * @method notice
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void
 */
IRCHandler.prototype.notice = function(client, message) {
	if (!message.target || !message.message) {
		return false;
	}

	eventManager.insertEvent(client, message, 'notice');
};

/**
 * Handles an incoming usermode event
 *
 * @method usermode
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void
 */
IRCHandler.prototype.usermode = function(client, message) {
	if (!message.nickname || !message.mode) {
		return false;
	}

	eventManager.insertEvent(client, message, 'usermode');
};

/**
 * Handles an incoming ctcp_response event
 *
 * @method ctcp_response
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void
 */
IRCHandler.prototype.ctcp_response = function(client, message) {
	if (!message.username || !message.hostname || !message.nickname || !message.target || !message.type || !message.message) {
		return false;
	}

	eventManager.insertEvent(client, message, 'ctcp_response');
};

/**
 * Handles an incoming ctcp request event
 *
 * @method ctcp_request
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void
 */
IRCHandler.prototype.ctcp_request = function(client, message) {
	if (!message.username || !message.hostname || !message.nickname || !message.target || !message.type || !message.message) {
		return false;
	}

	if (message.type.toUpperCase() == 'VERSION') {
		var version = 'IRCAnywhere v' + application.packagejson.version + ' ' + application.packagejson.homepage;
		ircFactory.send(client._id, 'ctcp', [message.nickname, 'VERSION', version]);
	}

	eventManager.insertEvent(client, message, 'ctcp_request');
};

/**
 * Handles an incoming unknown event
 *
 * @method unknown
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void
 */
IRCHandler.prototype.unknown = function(client, message) {
	if (this.blacklisted.indexOf(message.command) === -1) {
		message.message = message.params.join(' ');
		eventManager.insertEvent(client, message, 'unknown');
	}
};

/**
 * Handles an incoming banlist event
 *
 * @method banlist
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void
 */
IRCHandler.prototype.banlist = function(client, message) {
	if (!message.channel || !message.banlist) {
		return false;
	}

	rpcHandler.push(client.internal.userId, 'banList', {channel: message.channel, items: message.banlist, type: 'banList'});
};

/**
 * Handles an incoming invitelist event
 *
 * @method invitelist
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void
 */
IRCHandler.prototype.invitelist = function(client, message) {
	if (!message.channel || !message.invitelist) {
		return false;
	}

	rpcHandler.push(client.internal.userId, 'inviteList', {channel: message.channel, items: message.invitelist, type: 'inviteList'});
};

/**
 * Handles an incoming exceptlist event
 *
 * @method exceptlist
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void
 */
IRCHandler.prototype.exceptlist = function(client, message) {
	if (!message.channel || !message.exceptlist) {
		return false;
	}

	rpcHandler.push(client.internal.userId, 'exceptList', {channel: message.channel, items: message.exceptlist, type: 'exceptList'});
};

/**
 * Handles an incoming quietlist event
 *
 * @method quietlist
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void
 */
IRCHandler.prototype.quietlist = function(client, message) {
	if (!message.channel || !message.quietlist) {
		return false;
	}

	rpcHandler.push(client.internal.userId, 'quietList', {channel: message.channel, items: message.quietlist, type: 'quietList'});
};

/**
 * Handles an incoming list event
 *
 * @method list
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void
 */
IRCHandler.prototype.list = function(client, message) {
	if (!message.list || !message.search || !message.page || !message.limit) {
		return false;
	}

	client.internal._listBlock = false;
	// mark list block as false now we have the response
	
	rpcHandler.push(client.internal.userId, 'list', {search: message.search, page: message.page, limit: message.limit, channels: message.list, network: client.name});
};

/**
 * Handles an incoming whois event
 *
 * @method whois
 * @param {Object} client A valid client object
 * @param {Object} message A valid message object
 * @return void
 */
IRCHandler.prototype.whois = function(client, message) {
	if (!message.nickname || !message.username || !message.hostname) {
		return false;
	}

	message.network = client._id;
	rpcHandler.push(client.internal.userId, 'whois', message);
};

/* XXX - Events TODO
 	
 	away 		-  maybe this should alter the network status?
 	unaway		-  ^
 	names 		-  kinda done, need to determine whether they've ran /names or not and show it as a model maybe
 	links 		-  still needs to be implemented, although the basis in irc-factory is there
 */

IRCHandler.prototype = _.extend(IRCHandler.prototype, hooks);

exports.IRCHandler = IRCHandler;
