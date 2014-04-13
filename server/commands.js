/**
 * IRCAnywhere server/commands.js
 *
 * @title CommandManager
 * @copyright (c) 2013-2014 http://ircanywhere.com
 * @license GPL v2
 * @author Ricki Hastings
*/

var _ = require('lodash'),
	hooks = require('hooks'),
	helper = require('../lib/helpers').Helpers,
	mongo = require('mongodb');

/**
 * Responsible for handling all incoming commands from websocket clients
 *
 * @class CommandManager
 * @method CommandManager
 * @return void
 */
function CommandManager() {
	var self = this;

	application.ee.on('ready', function() {
		fibrous.run(self.init.bind(self));
	});
}

/**
 * Called when the application is booted and everything is ready, sets up an observer
 * on the commands collection for inserts and handles them accordingly.
 * Also sets up aliases, this should not be recalled, although can be extended to setup
 * your own aliases.
 *
 * @method init
 * @return void
 */
CommandManager.prototype.init = function() {
	var self = this;

	application.ee.on(['commands', 'insert'], function(doc) {
		fibrous.run(function() {
			var user = application.Users.sync.findOne({_id: doc.user}),
				client = Clients[doc.network.toString()];
			// get some variables

			self.parseCommand(user, client, doc.target, doc.command, doc._id);
			// success
		});
	});

	this.createAlias('/join', '/j');
	this.createAlias('/part', '/p', '/leave');
	this.createAlias('/cycle', '/hop');
	this.createAlias('/quit', '/disconnect');
	this.createAlias('/query', '/q');
	this.createAlias('/reconnect', '/connect');
	this.createAlias('/nickserv', '/ns');
	// setup aliases
}

/**
 * Sets +b/-b on a specific channel on a chosen client, not extendable
 * and private.
 *  
 * @method _ban
 * @param {Object} client A valid client object
 * @param {String} channel A channel name
 * @param {String} nickname A nickname or hostname to ban
 * @param {Boolean} ban Whether to ban or unban
 * @return void
 */
CommandManager.prototype._ban = function(client, channel, nickname, ban) {
	var nickname = params[0],
		mode = (ban) ? '+b' : '-b',
		user = application.ChannelUsers.sync.findOne({
			network: client.name,
			channel: new RegExp('^' + channel + '$', 'i'),
			nickname: new RegExp('^' + nickname + '$', 'i')
		});

	if (user === undefined) {
		return false;
	} else {
		ircFactory.send(client._id, 'mode', [channel, mode, '*@' + user.hostname]);
	}
	// cant find a user
}

/**
 * Creates an alias from the first parameter to the remaining ones.
 * 
 * Examples: ::
 *
 * 	commandManager.createAlias('/part', '/p', '/leave');
 * 	// sets an alias for /p and /leave to forward to /part
 *
 * @method createAlias
 * @param {String} command A command to alias
 * @param {...String} alias A command to map to
 * @return void
 */
CommandManager.prototype.createAlias = function() {
	var self = this,
		original = arguments[0].substr(1),
		aliases = Array.prototype.slice.call(arguments, 1);

	if (!_.isFunction(this[original])) {
		return false;
	}
	// isn't a valid function anyway

	aliases.forEach(function(alias) {
		alias = alias.substr(1);
		self[alias] = self[original];
	});
}

/**
 * Parse a command string and determine where to send it after that based on what it is
 * ie just text or a string like: '/join #channel'
 * 
 * @method parseCommand
 * @param {Object} user A valid user object
 * @param {Object} client A valid client object
 * @param {String} target Target to send command to, usually a channel or username
 * @param {String} command The command string
 * @return void
 */
CommandManager.prototype.parseCommand = function(user, client, target, command, id) {
	if (client === undefined) {
		return false;
	}
	// we've recieved a key for an invalid network

	if (command.charAt(0) === '/' && command.charAt(1) !== '/') {
		var params = command.split(/ +/),
			execute = params[0].toLowerCase().substr(1);
			params.shift();

		if (_.isFunction(this[execute])) {
			this[execute].call(this, user, client, target, params, false, id);
		} else {
			this['raw'](user, client, target, [execute].concat(params));
		}
		// is this a command? if it's prefixed with one / then yes
	} else {
		command = (command.charAt(1) === '/') ? command.substr(1) : command;
		// strip one of the /'s off if it has two at the start

		this['msg'](user, client, target, command.split(' '), true);
		// just split it to follow standards with other commands, it'll be rejoined before sent out
	}

	application.Users.update({_id: user._id}, {$set: {lastSeen: new Date()}}, {safe: false});
	// update last seen time
}

/**
 * '/nickserv' command
 *
 * @method msg
 * @param {Object} user A valid user object
 * @param {Object} client A valid client object
 * @param {String} target Target to send command to, usually a channel or username
 * @param {String} command The command string
 * @param {Boolean} out Used to force the message to target or params[0]
 * @param {ObjectID} id The object id of the command so we can remove it if we need to
 * @return void
 */
CommandManager.prototype.nickserv = function(user, client, target, params, out, id) {
	if (params.length === 0) {
		return false;
	}

	ircFactory.send(client._id, 'raw', ['nickserv'].concat(params));

	if (params[0].toLowerCase() === 'identify' || params[0].toLowerCase() === 'id' || params[0].toLowerCase() === 'login') {
		application.Commands.remove({_id: id}, {safe: false});
	}
	// remove sensitive commands
}

/**
 * '/msg' command
 *
 * @method msg
 * @param {Object} user A valid user object
 * @param {Object} client A valid client object
 * @param {String} target Target to send command to, usually a channel or username
 * @param {String} command The command string
 * @param {Boolean} out Used to force the message to target or params[0]
 * @param {ObjectID} id The object id of the command so we can remove it if we need to
 * @return void
 */
CommandManager.prototype.msg = function(user, client, target, params, out, id) {
	var out = out || false;

	if (params.length === 0 || target === undefined) {
		return false;
	}

	if (!out) {
		var target = params[0];
		params.shift();
	}

	if (params.length === 0) {
		return false;
	}
	// check again

	ircFactory.send(client._id, 'privmsg', [target, params.join(' '), true]);
	// append with true to get it pushed back down to us, irc-factory handles this now, because we
	// do parsing on the privmsg there, and splitting etc, no point duplicating the code

	if (target.toLowerCase() === 'nickserv' && (params[0].toLowerCase() === 'identify' || params[0].toLowerCase() === 'id' || params[0].toLowerCase() === 'login')) {
		application.Commands.remove({_id: id}, {safe: false});
	}
	// remove sensitive commands
}

/**
 * '/notice' command
 *
 * @method notice
 * @param {Object} user A valid user object
 * @param {Object} client A valid client object
 * @param {String} target Target to send command to, usually a channel or username
 * @param {String} command The command string
 * @return void
 */
CommandManager.prototype.notice = function(user, client, target, params) {
	if (params.length === 0) {
		return false;
	}

	ircFactory.send(client._id, 'notice', [target, params.join(' '), true]);
	// again append with true
}

/**
 * '/me' command
 *
 * @method me
 * @param {Object} user A valid user object
 * @param {Object} client A valid client object
 * @param {String} target Target to send command to, usually a channel or username
 * @param {String} command The command string
 * @return void
 */
CommandManager.prototype.me = function(user, client, target, params) {
	if (params.length === 0) {
		return false;
	}

	ircFactory.send(client._id, 'me', [target, params.join(' '), true]);
	// append with true
}

/**
 * '/join' command
 *
 * @method join
 * @param {Object} user A valid user object
 * @param {Object} client A valid client object
 * @param {String} target Target to send command to, usually a channel or username
 * @param {String} command The command string
 * @return void
 */
CommandManager.prototype.join = function(user, client, target, params) {
	if (params.length > 0 && helper.isChannel(client, params[0])) {
		var channel = params[0],
			password = (params.length === 1) ? '' : params[1];
	} else {
		var channel = target,
			password = (params.length === 0) ? '' : params[0];
	}
	// look for our parameters, we're expecting '#channel password' here, or '#channel'
	// the original IRC protocol accepts '#channel1,#channel2' this command doesn't at
	// the moment because we're attempting to look for a password so we can remember it

	ircFactory.send(client._id, 'join', [channel, password]);
	// send the join command

	var index = _.findIndex(client.channels, {channel: channel.toLowerCase()});
	if (index === -1) {
		client.channels.push({
			channel: channel.toLowerCase(),
			password: password
		});
	} else {
		client.channels[index] = {
			channel: channel.toLowerCase(),
			password: password
		};
	}
	// attempt to figure out if we've got an autojoin record set - just defining a
	// tab isn't enough for us

	application.Networks.update({_id: client._id}, {$set: {channels: client.channels}}, {safe: false});
	// we'll also store it in our reconnect settings
}

/**
 * '/part' command
 *
 * @method part
 * @param {Object} user A valid user object
 * @param {Object} client A valid client object
 * @param {String} target Target to send command to, usually a channel or username
 * @param {String} command The command string
 * @return void
 */
CommandManager.prototype.part = function(user, client, target, params) {
	if (params.length !== 0 && helper.isChannel(client, params[0])) {
		var channel = params[0];
		ircFactory.send(client._id, 'part', params);
	} else {
		var channel = target;
		ircFactory.send(client._id, 'part', [target].concat(params));
	}

	var index = _.findIndex(client.channels, {channel: channel.toLowerCase()});
	if (index > -1) {
		application.Networks.update({_id: client._id}, {$pull: {channels: client.channels[index]}}, {safe: false});
	}
	// does the index exist? lets remove it if so
}

/**
 * '/cycle' command
 *
 * @method cycle
 * @param {Object} user A valid user object
 * @param {Object} client A valid client object
 * @param {String} target Target to send command to, usually a channel or username
 * @param {String} command The command string
 * @return void
 */
CommandManager.prototype.cycle = function(user, client, target, params) {
	if (helper.isChannel(client, params[0])) {
		ircFactory.send(client._id, 'part', params);
		ircFactory.send(client._id, 'join', params);
	} else {
		ircFactory.send(client._id, 'part', [target].concat(params));
		ircFactory.send(client._id, 'join', [target].concat(params));
	}
}

/**
 * '/topic' command
 *
 * @method topic
 * @param {Object} user A valid user object
 * @param {Object} client A valid client object
 * @param {String} target Target to send command to, usually a channel or username
 * @param {String} command The command string
 * @return void
 */
CommandManager.prototype.topic = function(user, client, target, params) {
	if (params.length === 0) {
		return false;
	}

	if (helper.isChannel(client, params[0])) {
		var topic = [params.slice(1).join(' ')];
		ircFactory.send(client._id, 'topic', [params[0]].concat(topic));
	} else {
		var topic = [params.join(' ')];
		ircFactory.send(client._id, 'topic', [target].concat(topic));
	}
	// we need to do some altering on the topic becasue it has multiple spaces
}

/**
 * '/mode' command
 *
 * @method mode
 * @param {Object} user A valid user object
 * @param {Object} client A valid client object
 * @param {String} target Target to send command to, usually a channel or username
 * @param {String} command The command string
 * @return void
 */
CommandManager.prototype.mode = function(user, client, target, params) {
	if (helper.isChannel(client, params[0])) {
		ircFactory.send(client._id, 'mode', params);
	} else {
		ircFactory.send(client._id, 'mode', [target].concat(params));
	}
}

/**
 * '/invite' command
 *
 * @method invite
 * @param {Object} user A valid user object
 * @param {Object} client A valid client object
 * @param {String} target Target to send command to, usually a channel or username
 * @param {String} command The command string
 * @return void
 */
CommandManager.prototype.invite = function(user, client, target, params) {
	if (params.length !== 0 && helper.isChannel(client, params[0])) {
		ircFactory.send(client._id, 'raw', ['INVITE'].concat(params));
	} else {
		ircFactory.send(client._id, 'raw', ['INVITE', params[0], target]);
	}
}

/**
 * '/kick' command
 *
 * @method kick
 * @param {Object} user A valid user object
 * @param {Object} client A valid client object
 * @param {String} target Target to send command to, usually a channel or username
 * @param {String} command The command string
 * @return void
 */
CommandManager.prototype.kick = function(user, client, target, params) {
	if (params.length !== 0 && helper.isChannel(client, params[0])) {
		ircFactory.send(client._id, 'raw', ['KICK'].concat(params));
	} else {
		ircFactory.send(client._id, 'raw', ['KICK', target].concat(params));
	}
}

/**
 * '/kickban' command
 *
 * @method kickban
 * @param {Object} user A valid user object
 * @param {Object} client A valid client object
 * @param {String} target Target to send command to, usually a channel or username
 * @param {String} command The command string
 * @return void
 */
CommandManager.prototype.kickban = function(user, client, target, params) {
	this['ban'](user, client, target, params);
	this['kick'](user, client, target, params);
	// just straight up alias the commands
}

/**
 * '/ban' command
 *
 * @method ban
 * @param {Object} user A valid user object
 * @param {Object} client A valid client object
 * @param {String} target Target to send command to, usually a channel or username
 * @param {String} command The command string
 * @return void
 */
CommandManager.prototype.ban = function(user, client, target, params) {
	this._ban(client, target, nickname, ban, '+b');
	// +b
}

/**
 * '/unban' command
 *
 * @method unban
 * @param {Object} user A valid user object
 * @param {Object} client A valid client object
 * @param {String} target Target to send command to, usually a channel or username
 * @param {String} command The command string
 * @return void
 */
CommandManager.prototype.unban = function(user, client, target, params) {
	this._ban(client, target, nickname, ban, '-b');
	// -b
}

/**
 * '/nick' command
 *
 * @method nick
 * @param {Object} user A valid user object
 * @param {Object} client A valid client object
 * @param {String} target Target to send command to, usually a channel or username
 * @param {String} command The command string
 * @return void
 */
CommandManager.prototype.nick = function(user, client, target, params) {
	if (params.length > 0) {
		ircFactory.send(client._id, 'raw', ['NICK'].concat(params));
	}
}

/**
 * '/ctcp' command
 *
 * @method ctcp
 * @param {Object} user A valid user object
 * @param {Object} client A valid client object
 * @param {String} target Target to send command to, usually a channel or username
 * @param {String} command The command string
 * @return void
 */
CommandManager.prototype.ctcp = function(user, client, target, params) {
	var targ = params[0],
		type = params[1];

	if (user && type) {
		ircFactory.send(client._id, 'privmsg', [targ, '\x01' + type.toUpperCase() + '\x01', true]);
	}
}

/**
 * '/away' command
 *
 * @method away
 * @param {Object} user A valid user object
 * @param {Object} client A valid client object
 * @param {String} target Target to send command to, usually a channel or username
 * @param {String} command The command string
 * @return void
 */
CommandManager.prototype.away = function(user, client, target, params) {
	var message = (params.length === 0) ? 'Away from client' : params.join(' ');
	ircFactory.send(client._id, 'raw', ['AWAY', message]);
}

/**
 * '/unaway' command
 *
 * @method unaway
 * @param {Object} user A valid user object
 * @param {Object} client A valid client object
 * @param {String} target Target to send command to, usually a channel or username
 * @param {String} command The command string
 * @return void
 */
CommandManager.prototype.unaway = function(user, client, target, params) {
	ircFactory.send(client._id, 'raw', ['AWAY']);
}

/**
 * '/close' command
 *
 * @method close
 * @param {Object} user A valid user object
 * @param {Object} client A valid client object
 * @param {String} target Target to send command to, usually a channel or username
 * @param {String} command The command string
 * @return void
 */
CommandManager.prototype.close = function(user, client, target, params) {
	var tab = application.Tabs.sync.findOne({target: target, network: client._id});
	// get the tab in question

	if (!tab) {
		return false;
	}

	if (tab.type === 'channel') {
		if (tab.active) {
			ircFactory.send(client._id, 'part', [target]);
		}

		networkManager.removeTab(client, target);
		// determine what to do with it, if it's a channel /part and remove tab

		var index = _.findIndex(client.channels, {channel: target.toLowerCase()});
		
		if (index > -1) {
			application.Networks.update({_id: client._id}, {$pull: {channels: client.channels[index]}}, {safe: false});
		}
		// does the index in client.channels exist? lets remove it if so
	} else if (tab.type === 'query') {
		networkManager.removeTab(client, target);
		// if its a query just remove tab
	} else if (tab.type === 'network') {
		if (tab.active) {
			ircFactory.destroy(client._id);
		}

		networkManager.removeTab(client);
		// if it's a network /quit and remove tab(s)
	}
}

/**
 * '/query' command
 *
 * @method query
 * @param {Object} user A valid user object
 * @param {Object} client A valid client object
 * @param {String} target Target to send command to, usually a channel or username
 * @param {String} command The command string
 * @return void
 */
CommandManager.prototype.query = function(user, client, target, params) {
	networkManager.addTab(client, target, 'query', true);
}

/**
 * '/quit' command
 *
 * @method quit
 * @param {Object} user A valid user object
 * @param {Object} client A valid client object
 * @param {String} target Target to send command to, usually a channel or username
 * @param {String} command The command string
 * @return void
 */
CommandManager.prototype.quit = function(user, client, target, params) {
	networkManager.changeStatus({_id: client._id}, networkManager.flags.disconnected);
	// mark as connecting and mark the tab as active again

	ircFactory.destroy(client._id);
}

/**
 * '/reconnect' command
 *
 * @method reconnect
 * @param {Object} user A valid user object
 * @param {Object} client A valid client object
 * @param {String} target Target to send command to, usually a channel or username
 * @param {String} command The command string
 * @return void
 */
CommandManager.prototype.reconnect = function(user, client, target, params) {
	if (helper.exists(client, 'internal.connected') || helper.exists(client, 'internal.connecting')) {
		ircFactory.send(client._id, 'reconnect', []);
	} else {
		networkManager.connectNetwork(client);
	}
	// send the go ahead

	networkManager.changeStatus(client._id, networkManager.flags.connecting);
	// mark as connecting and mark the tab as active again
}

/**
 * '/list' command
 *
 * @method list
 * @param {Object} user A valid user object
 * @param {Object} client A valid client object
 * @param {String} target Target to send command to, usually a channel or username
 * @param {String} command The command string
 * @return void
 */
CommandManager.prototype.list = function(user, client, target, params) {
	if (helper.exists(client, 'internal._listBlock')) {
		return;
	}

	client.internal._listBlock = true;
	// block them from pushing this command out again until it's freed

	var search = params[0] || '*',
		page = params[1] || 1,
		limit = 20;
	// pull out params

	ircFactory.send(client._id, 'list', [search, page, limit]);
}

/**
 * '/raw' command
 *
 * @method raw
 * @param {Object} user A valid user object
 * @param {Object} client A valid client object
 * @param {String} target Target to send command to, usually a channel or username
 * @param {String} command The command string
 * @return void
 */
CommandManager.prototype.raw = function(user, client, target, params) {
	if (params.length === 0) {
		return false;
	}

	var command = params[0].toUpperCase(),
		blacklist = ['LIST', 'WHO'];

	if (_.indexOf(blacklist, command) === -1) {
		ircFactory.send(client._id, 'raw', params);
	} else if (command === 'LIST') {
		this.list(user, client, target, params);
	}
	// XXX: here we do a little cheat and intercept their command
	// 		theres a blacklisted command at the moment (WHO)
	// 		we don't really ever need to do request a who list from the server
	// 		for a channel if we know we're in the channel because we have it stored in
	// 		a database..
}

exports.CommandManager = _.extend(CommandManager, hooks);