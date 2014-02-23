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

			self.parseCommand(user, client, doc.target, doc.command);
			// success
		});
	});

	this.createAlias('/join', '/j');
	this.createAlias('/part', '/p', '/leave');
	this.createAlias('/cycle', '/hop');
	this.createAlias('/quit', '/disconnect');
	this.createAlias('/query', '/q');
	this.createAlias('/reconnect', '/connect');
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
CommandManager.prototype.parseCommand = function(user, client, target, command) {
	if (client === undefined) {
		return false;
	}
	// we've recieved a key for an invalid network

	if (command.charAt(0) === '/' && command.charAt(1) !== '/') {
		var params = command.split(/ +/),
			execute = params[0].toLowerCase().substr(1);
			params.shift();

		if (_.isFunction(this[execute])) {
			this[execute].call(this, user, client, target, params);
		} else {
			this['raw'](user, client, target, params);
		}
		// is this a command? if it's prefixed with one / then yes
	} else {
		command = (command.charAt(1) === '/') ? command.substr(1) : command;
		// strip one of the /'s off if it has two at the start

		this['msg'](user, client, target, command.split(' '));
		// just split it to follow standards with other commands, it'll be rejoined before sent out
	}

	application.Users.update({_id: user._id}, {$set: {lastSeen: new Date()}}, {safe: false});
	// update last seen time
}

/**
 * '/msg' command
 *
 * @method msg
 * @param {Object} user A valid user object
 * @param {Object} client A valid client object
 * @param {String} target Target to send command to, usually a channel or username
 * @param {String} command The command string
 * @return void
 */
CommandManager.prototype.msg = function(user, client, target, params) {
	if (params.length == 0) {
		return false;
	}

	ircFactory.send(client._id, 'privmsg', [target, params.join(' ')]);
	ircFactory.send(client._id, '_parseLine', [':' + client.nick + '!' + client.user + '@' + client.hostname + ' PRIVMSG ' + target + ' :' + params.join(' ')]);
	// nope this is a message, lets just send it straight out because if the target
	// is empty then it won't have been accepted into the collection
	// bit of hackery here but we also send it to _parseLine so it comes right
	// back through and looks like it's came from someone else - it's actually 99.9% more cleaner than the
	// last buggy implementation so I'm very happy with this, don't fuck about it with it.
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
	if (params.length == 0) {
		return false;
	}

	ircFactory.send(client._id, 'notice', [target, params.join(' ')]);
	ircFactory.send(client._id, '_parseLine', [':' + client.nick + '!' + client.user + '@' + client.hostname + ' NOTICE ' + target + ' :' + params.join(' ')]);
	// same as above, we don't get a reciept for notices so we push it back through our buffer
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
	if (params.length == 0) {
		return false;
	}

	ircFactory.send(client._id, 'me', [target, params.join(' ')]);
	ircFactory.send(client._id, '_parseLine', [':' + client.nick + '!' + client.user + '@' + client.hostname + ' PRIVMSG ' + target + ' :' + String.fromCharCode(1) + 'ACTION ' + params.join(' ') + String.fromCharCode(1)]);
	// same as above, we don't get a reciept for /me so we push it back through our buffer
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

	application.Networks.sync.update({_id: client._id}, {$set: {channels: client.channels}});
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
		ircFactory.send(client._id, 'part', params);
	} else {
		ircFactory.send(client._id, 'part', [target].concat(params));
	}
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
	if (params.length == 0) {
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
		ircFactory.send(client._id, 'privmsg', [targ, String.fromCharCode(1) + type.toUpperCase() + String.fromCharCode(1)]);
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

	if (tab.type === 'channel') {
		if (tab.active) {
			ircFactory.send(client._id, 'part', [target]);
		}

		networkManager.removeTab(client, target);
		// determine what to do with it, if it's a channel /part and remove tab
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

	ircFactory.send(client._id, 'disconnect', [params]);
	// it's important we don't destroy the network here, because
	// doing a .connect to try and reconnect wont work, if the user closes the network
	// tab then we can call destroy then remove the tab and network record
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
	if (client.internal.connected || client.internal.connecting) {
		ircFactory.send(client._id, 'reconnect', []);
	} else {
		networkManager.connectNetwork(client);
	}
	// send the go ahead

	networkManager.changeStatus(client._id, networkManager.flags.connecting);
	// mark as connecting and mark the tab as active again
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
	}
	// XXX: here we do a little cheat and intercept their command
	// 		theres a few blacklisted commands at the moment (LIST, WHO)
	// 		we don't really ever need to do request a who list from the server
	// 		for a channel if we know we're in the channel because we have it stored in
	// 		a database.. And we want to avoid accepting LISTs for large networks full stop
}

exports.CommandManager = _.extend(CommandManager, hooks);