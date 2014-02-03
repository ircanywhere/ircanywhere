var _ = require('lodash'),
	hooks = require('hooks'),
	helper = require('../lib/helpers').Helpers,
	mongo = require('mongodb');

/**
 * Sets +b/-b on a specific channel on a chosen client, not extendable
 * and private.
 *  
 * @method _ban
 * @param 	{} client
 * @param 	{} target
 * @param 	{} nickname
 * @param 	{} ban
 * @private
 * @return 	void
 */
var _ban = function(client, target, nickname, ban) {
	var nickname = params[0],
		mode = (ban) ? '+b' : '-b',
		user = application.ChannelUsers.sync.findOne({
			network: client.name,
			channel: new RegExp('^' + target + '$', 'i'),
			nickname: new RegExp('^' + nickname + '$', 'i')
		});

	if (user === undefined) {
		return false;
	} else {
		ircFactory.send(client._id, 'mode', [target, mode, '*@' + user.hostname]);
	}
	// cant find a user
}

/**
 * Responsible for handling all incoming commands from websocket clients
 *
 * @class	CommandManager
 * @method	CommandManager
 * @extend 	false
 * @return	void
 */
function CommandManager() {
	var self = this;

	application.ee.on('ready', function() {
		fibrous.run(self.init.bind(self));
	});
}

/**
 * Called when the application is booted and everything is ready, sets up an observer
 * on the commands collection for inserts and handles them accordingly. Also sets up aliases
 *
 * @method	init
 * @extend 	true
 * @return	void
 */
CommandManager.prototype.init = function() {
	var self = this;

	application.ee.on(['commands', 'insert'], function(doc) {
		fibrous.run(function() {
			var user = application.Users.sync.findOne({_id: doc.user}),
				client = Clients[doc.network.toString()];
			// get some variables

			self.parseCommand(user, client, doc.target.toLowerCase(), doc.command);
			// success
		});
	});

	this.createAlias('/join', '/j');
	this.createAlias('/part', '/p', '/leave');
	this.createAlias('/cycle', '/hop');
	this.createAlias('/quit', '/disconnect');
	this.createAlias('/query', '/q');
	// setup aliases
}

/**
 * Creates an alias from the first parameter to the remaining ones.
 * 
 * Examples:
 *
 *		commandManager.createAlias('/part', '/p', '/leave');
 *		// sets an alias for /p and /leave to forward to /part
 *
 * @method 	createAlias
 * @param 	{String} command
 * @param 	{...} aliases
 * @extend 	true
 * @return 	void
 */
CommandManager.prototype.createAlias = function() {
	var self = this,
		original = arguments[0],
		aliases = Array.prototype.slice.call(arguments, 1);

	if (!_.isFunction(this[original])) {
		return false;
	}
	// isn't a valid function anyway

	aliases.forEach(function(alias) {
		self[alias] = self[original];
	});
}

/**
 * Parse a command string and determine where to send it after that based on what it is
 * ie just text or a string like: '/join #channel'
 * 
 * @method 	parseCommand
 * @param 	{Object} user
 * @param 	{Object} client
 * @param 	{String} target
 * @param 	{String} command
 * @extend 	true
 * @return 	void
 */
CommandManager.prototype.parseCommand = function(user, client, target, command) {
	if (client === undefined) {
		return false;
	}
	// we've recieved a key for an invalid network

	if (command.charAt(0) === '/' && command.charAt(1) !== '/') {
		var params = command.split(/ +/),
			execute = params[0].toLowerCase();
			params.shift();

		if (_.isFunction(this[execute])) {
			this[execute].call(this, user, client, target, params);
		} else {
			this['/raw'](user, client, target, params);
		}
		// is this a command? if it's prefixed with one / then yes
	} else {
		command = (command.charAt(1) === '/') ? command.substr(1) : command;
		// strip one of the /'s off if it has two at the start

		this['/msg'](user, client, target, command.split(' '));
		// just split it to follow standards with other commands, it'll be rejoined before sent out
	}
}

/**
 * '/msg' command
 *
 * @param 	{Object} user
 * @param 	{Object} client
 * @param 	{String} target
 * @param 	{String} params
 * @extend 	true
 * @return 	void
 */
CommandManager.prototype['/msg'] = function(user, client, target, params) {
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
 * @param 	{Object} user
 * @param 	{Object} client
 * @param 	{String} target
 * @param 	{String} params
 * @extend 	true
 * @return 	void
 */
CommandManager.prototype['/notice'] = function(user, client, target, params) {
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
 * @param 	{Object} user
 * @param 	{Object} client
 * @param 	{String} target
 * @param 	{String} params
 * @extend 	true
 * @return 	void
 */
CommandManager.prototype['/me'] = function(user, client, target, params) {
	if (params.length == 0) {
		return false;
	}

	ircFactory.send(client._id, 'me', [target, params.join(' ')]);
	ircFactory.send(client._id, '_parseLine', [':' + client.nick + '!' + client.user + '@' + client.hostname + ' PRIVMSG ' + target + ' :ACTION ' + params.join(' ') + '']);
	// same as above, we don't get a reciept for /me so we push it back through our buffer
}

/**
 * '/join' command
 *
 * @param 	{Object} user
 * @param 	{Object} client
 * @param 	{String} target
 * @param 	{String} params
 * @extend 	true
 * @return 	void
 */
CommandManager.prototype['/join'] = function(user, client, target, params) {
	if (params.length !== 0 && helper.isChannel(client, params[0])) {
		ircFactory.send(client._id, 'join', params);
	} else {
		ircFactory.send(client._id, 'join', [target].concat(params));
	}
}

/**
 * '/part' command
 *
 * @param 	{Object} user
 * @param 	{Object} client
 * @param 	{String} target
 * @param 	{String} params
 * @extend 	true
 * @return 	void
 */
CommandManager.prototype['/part'] = function(user, client, target, params) {
	if (params.length !== 0 && helper.isChannel(client, params[0])) {
		ircFactory.send(client._id, 'part', params);
	} else {
		ircFactory.send(client._id, 'part', [target].concat(params));
	}
}

/**
 * '/cycle' command
 *
 * @param 	{Object} user
 * @param 	{Object} client
 * @param 	{String} target
 * @param 	{String} params
 * @extend 	true
 * @return 	void
 */
CommandManager.prototype['/cycle'] = function(user, client, target, params) {
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
 * @param 	{Object} user
 * @param 	{Object} client
 * @param 	{String} target
 * @param 	{String} params
 * @extend 	true
 * @return 	void
 */
CommandManager.prototype['/topic'] = function(user, client, target, params) {
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
 * @param 	{Object} user
 * @param 	{Object} client
 * @param 	{String} target
 * @param 	{String} params
 * @extend 	true
 * @return 	void
 */
CommandManager.prototype['/mode'] = function(user, client, target, params) {
	if (helper.isChannel(client, params[0])) {
		console.log('target exists', params);
		ircFactory.send(client._id, 'mode', params);
	} else {
		console.log('no target', [target].concat(params));
		ircFactory.send(client._id, 'mode', [target].concat(params));
	}
}

/**
 * '/invite' command
 *
 * @param 	{Object} user
 * @param 	{Object} client
 * @param 	{String} target
 * @param 	{String} params
 * @extend 	true
 * @return 	void
 */
CommandManager.prototype['/invite'] = function(user, client, target, params) {
	if (params.length !== 0 && helper.isChannel(client, params[0])) {
		ircFactory.send(client._id, 'raw', ['INVITE'].concat(params));
	} else {
		ircFactory.send(client._id, 'raw', ['INVITE', params[0], target]);
	}
}

/**
 * '/kick' command
 *
 * @param 	{Object} user
 * @param 	{Object} client
 * @param 	{String} target
 * @param 	{String} params
 * @extend 	true
 * @return 	void
 */
CommandManager.prototype['/kick'] = function(user, client, target, params) {
	if (params.length !== 0 && helper.isChannel(client, params[0])) {
		ircFactory.send(client._id, 'raw', ['KICK'].concat(params));
	} else {
		ircFactory.send(client._id, 'raw', ['KICK', target].concat(params));
	}
}

/**
 * '/kickban' command
 *
 * @param 	{Object} user
 * @param 	{Object} client
 * @param 	{String} target
 * @param 	{String} params
 * @extend 	true
 * @return 	void
 */
CommandManager.prototype['/kickban'] = function(user, client, target, params) {
	this['/ban'](user, client, target, params);
	this['/kick'](user, client, target, params);
	// just straight up alias the commands
}

/**
 * '/ban' command
 *
 * @param 	{Object} user
 * @param 	{Object} client
 * @param 	{String} target
 * @param 	{String} params
 * @extend 	true
 * @return 	void
 */
CommandManager.prototype['/ban'] = function(user, client, target, params) {
	_ban(client, target, nickname, ban, '+b');
	// +b
}

/**
 * '/unban' command
 *
 * @param 	{Object} user
 * @param 	{Object} client
 * @param 	{String} target
 * @param 	{String} params
 * @extend 	true
 * @return 	void
 */
CommandManager.prototype['/unban'] = function(user, client, target, params) {
	_ban(client, target, nickname, ban, '-b');
	// -b
}

/**
 * '/nick' command
 *
 * @param 	{Object} user
 * @param 	{Object} client
 * @param 	{String} target
 * @param 	{String} params
 * @extend 	true
 * @return 	void
 */
CommandManager.prototype['/nick'] = function(user, client, target, params) {
	if (params.length > 0) {
		ircFactory.send(client._id, 'raw', ['NICK'].concat(params));
	}
}

/**
 * '/ctcp' command
 *
 * @param 	{Object} user
 * @param 	{Object} client
 * @param 	{String} target
 * @param 	{String} params
 * @extend 	true
 * @return 	void
 */
CommandManager.prototype['/ctcp'] = function(user, client, target, params) {
	var targ = params[0],
		type = params[1];

	if (user && type) {
		ircFactory.send(client._id, 'privmsg', [targ, '' + type.toUpperCase() + '']);
	}
}

/**
 * '/away' command
 *
 * @param 	{Object} user
 * @param 	{Object} client
 * @param 	{String} target
 * @param 	{String} params
 * @extend 	true
 * @return 	void
 */
CommandManager.prototype['/away'] = function(user, client, target, params) {
	var message = (params.length === 0) ? 'Away from client' : params.join(' ');
	ircFactory.send(client._id, 'raw', ['AWAY', message]);
}

/**
 * '/unaway' command
 *
 * @param 	{Object} user
 * @param 	{Object} client
 * @param 	{String} target
 * @param 	{String} params
 * @extend 	true
 * @return 	void
 */
CommandManager.prototype['/unaway'] = function(user, client, target, params) {
	ircFactory.send(client._id, 'raw', ['AWAY']);
}

/**
 * '/close' command
 *
 * @param 	{Object} user
 * @param 	{Object} client
 * @param 	{String} target
 * @param 	{String} params
 * @extend 	true
 * @return 	void
 */
CommandManager.prototype['/close'] = function(user, client, target, params) {
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

		//networkManager.removeTab(client);
		// if it's a network /quit and remove tab(s)
		// XXX - finish this
	}
}

/**
 * '/query' command
 *
 * @param 	{Object} user
 * @param 	{Object} client
 * @param 	{String} target
 * @param 	{String} params
 * @extend 	true
 * @return 	void
 */
CommandManager.prototype['/query'] = function(user, client, target, params) {
	networkManager.addTab(client, target, 'query', true);
}

/**
 * '/quit' command
 *
 * @param 	{Object} user
 * @param 	{Object} client
 * @param 	{String} target
 * @param 	{String} params
 * @extend 	true
 * @return 	void
 */
CommandManager.prototype['/quit'] = function(user, client, target, params) {
	ircFactory.send(client._id, 'disconnect', [params]);
	// it's important we don't destroy the network here, because
	// doing a .connect to try and reconnect wont work, if the user closes the network
	// tab then we can call destroy then remove the tab and network record
}

/**
 * '/reconnect' command
 *
 * @param 	{Object} user
 * @param 	{Object} client
 * @param 	{String} target
 * @param 	{String} params
 * @extend 	true
 * @return 	void
 */
CommandManager.prototype['/reconnect'] = function(user, client, target, params) {
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
 * @param 	{Object} user
 * @param 	{Object} client
 * @param 	{String} target
 * @param 	{String} params
 * @extend 	true
 * @return 	void
 */
CommandManager.prototype['/raw'] = function(user, client, target, params) {
	if (params.length > 0) {
		ircFactory.send(client._id, 'raw', params);
	}
}

exports.CommandManager = _.extend(CommandManager, hooks);