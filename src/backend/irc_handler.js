/* ============================================================
 * IRCAnywhere Confidential
 * ============================================================
 * 
 * (C) Copyright 2011 - 2012 IRCAnywhere (https://ircanywhere.com)
 * All Rights Reserved.
 * 
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE.txt', which is part of this source code package.
 *
 * ============================================================ */

exports.IrcHandler = {};
exports.IrcHandler.queue = require('function-queue')();

exports.IrcHandler.userlist = {};
// our internal storage objects

exports.IrcHandler.ignoredCommands = [
	'NICK',
	'QUIT',
	'RPL_LISTSTART',
	'RPL_LIST',
	'RPL_LISTEND',
	'RPL_ENDOFLIST',
	'RPL_WHOREPLY',
	'RPL_ENDOFWHO',
	'RPL_AWAY',
	'RPL_WHOISUSER',
	'RPL_WHOISIDLE',
	'RPL_WHOISCHANNELS',
	'RPL_WHOISSERVER',
	'RPL_WHOISMODES',
	'RPL_WHOISHOST',
	'RPL_WHOISADMIN',
	'RPL_WHOISOPERATOR',
	'RPL_WHOISHELPOP',
	'RPL_WHOISBOT',
	'RPL_WHOISSPECIAL',
	'RPL_WHOISSECURE',
	'RPL_WHOISACCOUNT',
	'RPL_ENDOFWHOIS'
];

var pkg = require('../../package.json'),
	database = require('./database').Database,
	stats = require('./stats').Stats,
	modeParser = require('./mode_parser').ModeParser,
	bufferEngine = require('./buffer_engine').BufferEngine,
	bnc = require('./bnc').BNC,
	server = require('./server').Server,
	system = require('./system').System,
	replyFor = require('../lib/codes');

/*
 * IrcHandler::handleEvents
 *
 * Handle all events such as 'join', 'part' etc..
 */
exports.IrcHandler.handleEvents = function(account, network, e, args)
{
	if (server.client_data[account]['networks'][network] == undefined)
		return;

	var _this = this,
		d = {
			account: account,
			network: network,
			networkName: server.client_data[account]['networks'][network].name
		};

	switch (e)
	{
		case 'registered':
			_this.handleWelcome(d, args[0]);
			break;
		case 'capabilities':
			_this.handleCapab(d, args[0], args[1]);
			break;
		case 'join':
			_this.handleJoin(d, args[0], args[1], args[2]);
			break;
		case 'part':
			_this.handlePart(d, args[0], args[1], args[2], args[3]);
			break;
		case 'kick':
			_this.handleKick(d, args[0], args[1], args[2], args[3], args[4]);
			break;
		case 'nick':
			_this.handleNick(d, args[0], args[1], args[2], args[3]);
			break;
		case 'quit':
			_this.handleQuit(d, args[0], args[1], args[2], args[3]);
			break;
		case 'topic':
			_this.handleTopic(d, args[0], args[1], args[2], args[3]);
			break;
		case 'mode':
			_this.handleMode(d, args[0], args[1], args[2], args[3]);
			break;
		case 'channellist':
			_this.handleList(d, args[0]);
			break;
		case 'whoreply':
			_this.handleWho(d, args[0], args[1], args[2], args[3], args[4]);
			break;
		case 'endofwho':
			_this.handleEndOfWho(d, args[0]);
			break;
		case 'whois':
			_this.handleWhois(d, args[0]);
			break;
		case 'ctcp':
			_this.handleCTCP(d, args[0], args[1], args[2], args[3]);
			break;
		case 'error':
			if (args[0].line != undefined)
			{
				system.networkLog(account, network, 'Error: ' + args[0].line);
				// log it
			}
			break;
		case 'raw':
			_this.handleRaw(d, args[0]);
			break;
		default:

			break;
	};
};

/*
 * IrcHandler::sendLine
 * 
 * This is the function used to send a line directly from websocket / any other input
 */
exports.IrcHandler.sendLine = function(user, network, line, socket)
{
	var socket = socket || null,
		args = line.split(' ');

	if (args[0].toUpperCase() == 'LIST' && socket != null)
	{
		_this.getChanList(socket, {network: network});
		// handle list internally
	}
	else if (args[0].toUpperCase() == 'PRIVMSG' || args[0].toUpperCase() == 'NOTICE')
	{
		var func = (args[0].toUpperCase() == 'PRIVMSG') ? 'say' : 'notice',
			newArgs = args.slice(2);

		server.client_data[user]['networks'][network].send('say', [args[1], newArgs.join(' ')]);
		// split up data.command and send it properly
	}
	else
	{
		server.client_data[user]['networks'][network].send('raw', [args.join(' ')]);
		// split up data.command and send it properly
	}
	// send out the data

	if (args[0].toUpperCase() == 'JOIN')
	{
		if (server.client_data[user]['networks'][network].keys == undefined)
			server.client_data[user]['networks'][network].keys = {};
		// check if the object exists

		var channels = args[1].split(',');
		// split channels up

		for (i = 0; i < channels.length; i++)
		{
			var channel = channels[i].toLowerCase();
			if (args[i + 2] != undefined)
				server.client_data[user]['networks'][network].keys[channel] = args[i + 2];
		}
	}
	// attempt to catch the channel key
};

/*
 * IrcHandler::handleRaw
 * 
 * This handles all raw data
 */
exports.IrcHandler.handleRaw = function(d, message)
{
	var _this = this;

	if (message.command != undefined)
		message.command = message.command.toUpperCase();

	if (server.client_data[d.account]['networks'][d.network] == undefined)
		return;

	if (message.command == 'CAP' || message.command == 'AUTHENTICATE' || (parseInt(message.rawCommand) >= 903 && parseInt(message.rawCommand) <= 907))
		_this.handleCAP(d, message);
	// handle CAP / SASL and other related stuff here (no point binding an event to it as it can be triggered in a few ways)

	if (message.command == 'RPL_LUSERCHANNELS')
		server.client_data[d.account]['networks'][d.network].extra.lchannels = message.args[1];
	// handle luser channels here, no need doing it elsewhere

	if (message.command == 'ERR_NICKNAMEINUSE')
		server.client_data[d.account]['networks'][d.network].forcedNickChange = true;
	// mark nickname as forced changed. so don't update the default record

	bufferEngine.compileOutgoing(d.account, d.network, message.line, function(outgoing)
	{
		var	type = (_this.isChannel(outgoing.target)) ? 'chan' : 'query';
		// compile our output array

		if (_this.ignoredCommands.indexOf(message.command) == -1)
		{
			_this.queue.push(function (callback, object)
			{
				var self = (message.nick == server.client_data[d.account]['networks'][d.network].nick) ? true : false;

				outgoing._id = bufferEngine.saveLogs(object.d.account, object.d.network, object.outgoing, self);
				outgoing.network = object.d.network;
				outgoing.tabId = server.generateTabId(object.d.network, type, outgoing.target);

				server.emit(server.client_data[object.d.account], 'data', object.outgoing);
				// they're connected, just send it straight out.

				callback();
			}, {d: d, outgoing: outgoing});
		}
		// insert it into the logfile
	});
};

/*
 * IrcHandler::handleCAP
 *
 * Handle SASL CAP stuff
 */
exports.IrcHandler.handleCAP = function(d, message)
{
	var _this = this;

	if (message.command == 'CAP')
		joinedMsg = message.args.join(' ');
	// join message.args together

	if (message.command == 'CAP' && message.args[0] == '*' && message.args[1] == 'LS')
	{
		var capabilities = message.args[2].split(' '),
			capreq = '';

		for (var i in capabilities)
		{
			var cap = capabilities[i];

			if (cap == 'multi-prefix')
				capreq += 'multi-prefix ';
			else if (cap == 'away-notify')
				capreq += 'away-notify ';
			else if (cap == 'sasl' && server.client_data[d.account]['networks'][d.network].sasl)
				capreq += 'sasl ';
		}

		if (capreq != '')
			server.client_data[d.account]['networks'][d.network].send('send', ['CAP', 'REQ', ':' + capreq]);
	}
	// handle the arguments

	if (message.command == 'CAP' && (message.args[1] == 'ACK' || message.args[1] == 'NAK') && !server.client_data[d.account]['networks'][d.network].sasl)
		server.client_data[d.account]['networks'][d.network].send('send', ['CAP', 'END']);
	// handle away-notify

	if (message.command == 'CAP' && (message.args[1] == 'ACK') && joinedMsg.indexOf('sasl') != -1)
		server.client_data[d.account]['networks'][d.network].send('send', ['AUTHENTICATE', 'PLAIN']);
	// tell the server we're going to authenticate plaintext

	if (message.command == 'AUTHENTICATE' && message.args[0] == '+')
	{
		var username = server.client_data[d.account]['networks'][d.network].nick,
			password = server.client_data[d.account]['networks'][d.network].password,
			tmp = new Buffer(username + '\0' + username + '\0' + password).toString('base64');
		// encode the base64 hash to send to the server

		server.client_data[d.account]['networks'][d.network].send('send', ['AUTHENTICATE', tmp]);
	}
	// authenticate when we're asked to.

	if (parseInt(message.rawCommand) >= 903 && parseInt(message.rawCommand) <= 907)
		server.client_data[d.account]['networks'][d.network].send('send', ['CAP', 'END']);
};

/*
 * IrcHandler::handleWelcome
 *
 * Handle welcome shit (on connect) (001)
 */
exports.IrcHandler.handleWelcome = function(d, message)
{
	var _this = this,
		allChans = {};

	clearTimeout(server.client_data[d.account]['networks'][d.network].timer);
	// clear any timeouts if they exist

	server.client_data[d.account]['networks'][d.network].nick = message.args[0];
	// change some variables

	for (var i = 0; i < server.client_data[d.account]['networks'][d.network].connect_commands.length; i++)
	{
		var command = server.client_data[d.account]['networks'][d.network].connect_commands[i];

		_this.sendLine(d.account, d.network, command);
		// send the line
	}
	// send our connect commands

	for (var chan in server.client_data[d.account]['networks'][d.network].autojoin_chans)
	{
		if (server.client_data[d.account]['networks'][d.network].autojoin_chans.hasOwnProperty(chan))
			allChans[chan] = server.client_data[d.account]['networks'][d.network].autojoin_chans[chan];
	}
	// find all autojoin channels

	for (var chan in server.client_data[d.account]['networks'][d.network].chans)
	{
		if (server.client_data[d.account]['networks'][d.network].chans.hasOwnProperty(chan))
			allChans[chan] = server.client_data[d.account]['networks'][d.network].chans[chan];
	}
	// find all previous channels (overwriting ones already in autojoin_chans)

	for (var chan in allChans)
	{
		server.client_data[d.account]['networks'][d.network].send('join', [chan + ' ' + allChans[chan]]);
	}
	// join all our channels

	server.client_data[d.account]['networks'][d.network].send('send', ['AWAY', 'Disconnected from client']);
	// away the client immediately, the login handler will mark this correct

	server.client_data[d.account]['networks'][d.network].chans = {};
	// join the channels & delete the old channel object because we'll create a new object
	// when we know that we've actually sucessfully joined the channels from the server
	// we could have been banned / key could have changed or +i could have been set while we've been offline

	bnc.setNetworkStatus(d.account, d.network, 'connected', {
		chans: _this.encodeChans(server.client_data[d.account]['networks'][d.network].chans)
	});
	// update the network status
};

/*
 * IrcHandler::handleCapab
 *
 * Handle CAPAB (005)
 */
exports.IrcHandler.handleCapab = function(d, supported, message)
{
	var _this = this;

	if (server.client_data[d.account]['networks'][d.network].extra == undefined)
		server.client_data[d.account]['networks'][d.network].extra = {};
	// quick check
	
	var extra = server.client_data[d.account]['networks'][d.network].extra;
	// assign that to extra, cause it's pretty long

	server.client_data[d.account]['networks'][d.network].nick = message.args[0];
	server.client_data[d.account]['networks'][d.network].name = supported.name
	
	extra.nonParamModes = supported.channel.modes.d;
	extra.paramModesUn = supported.channel.modes.c
	extra.restrictModes = supported.channel.modes.a
	extra.paramModes = (supported.channel.modes.a + supported.channel.modes.b + supported.channel.modes.c)
	extra.statusModes = supported.channel.modes.b.replace('k', '');
	extra.statusPrefix = supported.channel.prefixes;
	extra.channelTypes = supported.channel.types;
	extra.userModes = supported.usermodes;
	// capabilites have already been worked out by node-irc. Lets make use of them

	database.networkModel.update({_id: d.network}, {name: server.client_data[d.account]['networks'][d.network].name, extra: extra}, function(err)
	{
		extra = _this.splitCapabilities(extra);
		// split the mode strings up into arrays. we do all this because we store it in the database
		// in plaintext strings not arrays to save space. But we split it up when we use it. Because 005
		// is sent more than once, it may get split up more than once. We just leave it as is if its already split

		server.emit(server.client_data[d.account], 'networks', server.returnUI(server.client_data[d.account]['networks']));
	});
};

/*
 * IrcHandler::handleJoin
 *
 * Handle JOIN
 */
exports.IrcHandler.handleJoin = function(d, channel, nick, message)
{
	var _this = this;

	if (server.client_data[d.account]['networks'][d.network].nick == nick)
	{
		server.client_data[d.account]['networks'][d.network].send('send', ['TOPIC', channel]);
		server.client_data[d.account]['networks'][d.network].send('send', ['MODE', channel]);
		server.client_data[d.account]['networks'][d.network].send('send', ['WHO', channel]);

		if (server.client_data[d.account]['networks'][d.network].chans == undefined)
			server.client_data[d.account]['networks'][d.network].chans = {};
		
		if (server.client_data[d.account]['networks'][d.network].keys == undefined)
			var key = '';
		else
			var key = (server.client_data[d.account]['networks'][d.network].keys[channel] == undefined) ? '' : server.client_data[d.account]['networks'][d.network].keys[channel];
		// is there a key we know of?

		server.client_data[d.account]['networks'][d.network].chans[channel] = key;
		// add the joined channel
		
		database.networkModel.update({_id: d.network}, {chans: _this.encodeChans(server.client_data[d.account]['networks'][d.network].chans)}, function(err) {});
	}
	// make sure the above code is only executed when we join a channel

	database.channelDataModel.findOne({network: d.networkName, channel: channel}, function(err, doc)
	{
		doc = _this.checkObject(d.networkName, channel, doc);
		// check if the object exists

		doc.users[nick.toLowerCase()] = {user: nick, modes: '', prefix: '', away: false, hostname: message.prefix};
		doc.save();
	});
};

/*
 * IrcHandler::handlePart
 *
 * Handle PART
 */
exports.IrcHandler.handlePart = function(d, channel, nick, reason, message)
{
	var _this = this;

	if (server.client_data[d.account]['networks'][d.network].nick == nick)
	{
		delete server.client_data[d.account]['networks'][d.network].chans[channel];
		database.networkModel.update({_id: d.network}, {chans: _this.encodeChans(server.client_data[d.account]['networks'][d.network].chans)}, function(err) {});
		// update users data model
	}
	
	database.channelDataModel.findOne({network: d.networkName, channel: channel}, function(err, doc)
	{
		doc = _this.checkObject(d.networkName, channel, doc);
		// check if the object exists

		delete doc.users[nick.toLowerCase()];
		doc.save();
	});
};

/*
 * IrcHandler::handleKick
 *
 * Handle KICK
 */
exports.IrcHandler.handleKick = function(d, channel, nick, by, reason, message)
{
	var _this = this;

	if (server.client_data[d.account]['networks'][d.network].nick == nick)
	{
		delete server.client_data[d.account]['networks'][d.network].chans[channel];
		database.networkModel.update({_id: d.network}, {chans: _this.encodeChans(server.client_data[d.account]['networks'][d.network].chans)}, function(err) {});
		// update users data model
	}

	database.channelDataModel.findOne({network: d.networkName, channel: channel}, function(err, doc)
	{
		doc = _this.checkObject(d.networkName, channel, doc);
		// check if the object exists

		delete doc.users[nick.toLowerCase()];
		doc.save();
	});
};

/*
 * IrcHandler::handleMode
 *
 * Handle MODE
 */
exports.IrcHandler.handleMode = function(d, channel, by, modes, message)
{
	var _this = this;

	database.channelDataModel.findOne({network: d.networkName, channel: channel}, function(err, doc)
	{
		doc = _this.checkObject(d.networkName, channel, doc);
		// check if the object exists

		var modeArray = modeParser.sortModes(server.client_data[d.account]['networks'][d.network].extra, modes);

		modeParser.changeModes(doc, server.client_data[d.account]['networks'][d.network].extra, modeArray),
		modeParser.handleParams(doc, server.client_data[d.account]['networks'][d.network].extra, modeArray);
		// we have a list of changed users and modes. send them to the frontend

		server.emit(server.client_data[d.account], 'channelUpdate', {
			network: d.network,
			chan: channel,
			tabId: server.generateTabId(d.network, 'chan', channel),
			modes: doc.modes,
			users: doc.changedUsers,
			topic: doc.topic
		});
	});
};

/*
 * IrcHandler::handleTopic
 *
 * Handle TOPIC
 */
exports.IrcHandler.handleTopic = function(d, channel, topic, nick, message)
{
	var _this = this;
	
	database.channelDataModel.findOne({network: d.networkName, channel: channel}, function(err, doc)
	{
		doc = _this.checkObject(d.networkName, channel, doc);
		// check if the object exists

		doc.topic = topic;
		doc.save();

		server.emit(server.client_data[d.account], 'channelUpdate', {
			network: d.network,
			chan: channel,
			tabId: server.generateTabId(d.network, 'chan', channel),
			modes: doc.modes,
			users: doc.changedUsers,
			topic: doc.topic
		});
	});
};

/*
 * IrcHandler::handleNick
 *
 * Handle NICK
 */
exports.IrcHandler.handleNick = function(d, oldnick, newnick, channels, message)
{
	var _this = this;

	if (server.client_data[d.account]['networks'][d.network].nick == oldnick)
	{
		server.client_data[d.account]['networks'][d.network].nick = newnick;
		server.emit(server.client_data[d.account], 'networks', server.returnUI(server.client_data[d.account]['networks']));
		// update data model and emit some data

		if (!server.client_data[d.account]['networks'][d.network].forcedNickChange)
			database.networkModel.update({_id: d.network}, {nick: newnick}, function(err) {});
		
		server.client_data[d.account]['networks'][d.network].forcedNickChange = false;
		// determine whether to save the nick change
	}
	// make sure the above code is only executed when we perform a nick change

	for (var ci in channels)
	{
		var channel = channels[ci];

		database.channelDataModel.findOne({network: d.networkName, channel: ci}, function(err, doc)
		{
			doc = _this.checkObject(d.networkName, channel, doc);
			// check if the object exists

			if (doc.users[oldnick.toLowerCase()] !== undefined)
			{
				var extra = doc.users[oldnick.toLowerCase()];
					extra.user = newnick;

				doc.users[newnick.toLowerCase()] = extra;
				delete doc.users[oldnick.toLowerCase()];
				// recreate the new user, delete the old user from any records

				doc.save();
			}

			bufferEngine.compileOutgoing(d.account, d.network, message.line, function(outgoing)
			{
				var type = (_this.isChannel(outgoing.target)) ? 'chan' : 'query';

				outgoing.line = ':' + message.prefix + ' ' + message.command + ' :' + channel + ' ' + newnick;
				outgoing.args.unshift(channel);
				outgoing._id = bufferEngine.saveLogs(d.account, d.network, outgoing, false);
				outgoing.network = d.network;
				outgoing.read = true;
				outgoing.tabId = server.generateTabId(d.network, type, outgoing.target);

				server.emit(server.client_data[d.account], 'data', outgoing);
				// usually we send this out with raw data. But we modify it slightly
			});
		});
	}
};

/*
 * IrcHandler::handleQuit
 *
 * Handle QUIT
 */
exports.IrcHandler.handleQuit = function(d, nick, reason, channels, message)
{
	var _this = this;

	if (server.client_data[d.account]['networks'][d.network].nick == nick)
		_this.handleExit(d, nick);
	// are we disconnecting?

	for (var ci in channels)
	{
		database.channelDataModel.findOne({network: d.networkName, channel: ci}, function(err, doc)
		{
			doc = _this.checkObject(d.networkName, channel, doc);
			// check if the object exists

			var channel = channels[ci];
			
			bufferEngine.compileOutgoing(d.account, d.network, message.line, function(outgoing)
			{
				var type = (_this.isChannel(outgoing.target)) ? 'chan' : 'query';

				delete doc.users[nick.toLowerCase()];
				doc.save();
				// delete the user

				outgoing.line = ':' + message.prefix + ' ' + message.command + ' ' + channel + ' :' + reason;
				outgoing.args.unshift(channel);
				outgoing._id = bufferEngine.saveLogs(d.account, d.network, outgoing, false);
				outgoing.network = d.network;
				outgoing.read = true;
				outgoing.tabId = server.generateTabId(d.network, type, outgoing.target);

				server.emit(server.client_data[d.account], 'data', outgoing);
				// usually we send this out with raw data. But we modify it slightly
			});
		});
	}
};

/*
 * IrcHandler::handleExit
 *
 * Handle our QUITS or ERROR
 */
exports.IrcHandler.handleExit = function(d, nick)
{
	if (server.client_data[d.account]['networks'][d.network] == undefined)
		return;
	// already quit, not sure why it's being called twice.
	
	server.emit(server.client_data[d.account], 'networks', server.returnUI(server.client_data[d.account]['networks']));
	// update users

	system.networkLog(d.account, d.network, 'disconnecting from ' + server.client_data[d.account]['networks'][d.network].host + ':' + server.client_data[d.account]['networks'][d.network].port);
	// log it

	var active = false;
	for (var net in server.client_data[d.account]['networks'])
	{
		if (server.client_data[d.account]['networks'][d.network].status == 'connected')
			active = true;
	}

	if (!server.client_data[d.account].logged_in)
	{
		server.client_data[d.account].is_connected = active;
		database.userModel.update({account: d.account}, {is_connected: server.client_data[d.account].is_connected}, function(err) {});
	}
	// determine whether to mark this user as inactive

	server.client_data[d.account]['networks'][d.network].timer = setTimeout(function() {
		server.client_data[d.account]['networks'][d.network].send('connect', []);
		// attempt to reconnect
	}, 30000);
	// wait about 30 seconds before removing the unused object
	// causes problems if we delete it straight away, or too quickly
};

/*
 * IrcHandler::handleWho
 *
 * Handle WHO
 */
exports.IrcHandler.handleWho = function(d, channel, hostname, nick, extra, message)
{
	var _this = this,
		away = (extra.charAt(0) == 'H') ? false : true;
	// normal who response
	
	var ret = modeParser.convertToPrefix(server.client_data[d.account]['networks'][d.network].extra, nick, extra);
	// calculate the prefix

	if (ret == undefined || ret.modes == undefined)
		modes = '';
	else
		modes = ret.modes;

	if (_this.userlist[channel] == undefined)
		_this.userlist[channel] = {};

	_this.userlist[channel][nick.toLowerCase()] = {user: nick, modes: modes, prefix: ret.prefix, away: away, hostname: hostname};
	// alter the users list
};

/*
 * IrcHandler::handleEndOfWho
 *
 * Handle RPL_ENDOFWHO
 */
exports.IrcHandler.handleEndOfWho = function(d, channel)
{
	var _this = this;

	database.channelDataModel.findOne({network: d.networkName, channel: channel}, function(err, doc)
	{
		doc = _this.checkObject(d.networkName, channel, doc);
		// check if the object exists

		var tabId = server.generateTabId(d.network, 'chan', channel);

		if (doc != null)
		{
			doc.users = _this.userlist[channel];
			doc.save();

			server.emit(server.client_data[d.account], 'userlist', {
				network: d.network,
				chan: channel,
				tabId: tabId,
				list: doc.users
			});
			
			delete _this.userlist[channel];
		}
	});
};

/*
 * IrcHandler::handleWhois
 *
 * Handle whois reply
 */
exports.IrcHandler.handleWhois = function(d, data)
{
	var tabId = server.generateTabId(d.network, 'window');

	server.emit(server.client_data[d.account], 'whois', {
		network: d.network, 
		nick: data.nick,
		tabId: tabId,
		info: data
	});
};

/*
 * IrcHandler::handleCTCP
 *
 * Handle CTCPs
 */
exports.IrcHandler.handleCTCP = function(d, from, to, text, type)
{
	if (text == 'VERSION')
		var reply = 'VERSION IRCAnywhere ' + pkg.version + ' ircanywhere.com <support@ircanywhere.com>';
	else if (text == 'TIME')
		var reply = 'TIME ' + new Date();

	if (reply != undefined)
		server.client_data[d.account]['networks'][d.network].send('ctcp', [from, 'notice', reply]);
};

/*
 * IrcHandler::handleList
 *
 * A function to handle the channel list
 */
exports.IrcHandler.handleList = function(d, channellist)
{
	var hash = d.account + d.network + server.client_data[d.account]['networks'][d.network].nick.toLowerCase(),
		tabId = server.generateTabId(d.network, 'other-list');

	server.createHTTPChunk(server.client_data[d.account], hash, 'chanlist', {
		network: d.network,
		tabId: tabId,
		channels: channellist
	});
};

/*
 * IrcHandler::checkObject
 *
 * A helper function to check if the channel object exists
 */
exports.IrcHandler.checkObject = function(name, chan, doc)
{
	if (doc == null)
	{
		doc = new database.channelDataModel();
		doc.channel = chan;
		doc.topic = '';
		doc.modes = '';
		doc.users = {};
		doc.changedUsers = {};

		return doc;
	}
	else
	{
		return doc;
	}
};

/*
 * IrcHandler::encodeChans
 *
 * A helper function to encode the channel object
 */
exports.IrcHandler.encodeChans = function(chans)
{
	var newChans = {};
	for (var chan in chans)
	{
		var encode = new Buffer(chan).toString('base64'),
			password = chans[chan];

		newChans[encode] = password;
	}

	return newChans;
};

/*
 * IrcHandler::isChannel
 *
 * A helper function to check if the name is a valid channel name (#&) etc ..
 * We take the account and network because we need to know the channelTypes string
 */
exports.IrcHandler.isChannel = function(account, network, channel)
{
	if (server.client_data[account] == undefined ||
		server.client_data[account]['networks'][network] == undefined)
		return false;

	var firstChar = (channel == '') ? '' : channel.charAt(0),
		extra = server.client_data[account]['networks'][network].extra,
		types = (extra == undefined || extra.channelTypes) ? ['#'] : extra.channelTypes;
		types = (typeof types == 'string') ? types.split('') : types;
	// if we can't find any types or it isnt an array we reset it

	if (types == undefined)
		types = ['#'];

	if (types.indexOf(firstChar) > -1)
		return true;
	// if the channel is a valid type then return true

	return false;
};

/*
 * IrcHandler::splitCapabilities
 *
 * A helper function to split capabilities up
 */
exports.IrcHandler.splitCapabilities = function(extra)
{
	if (extra == undefined)
		return false;
	
	extra.nonParamModes = (typeof extra.nonParamModes == 'string') ? extra.nonParamModes.split('') : extra.nonParamModes;
	extra.paramModesUn = (typeof extra.paramModesUn == 'string') ? extra.paramModesUn.split('') : extra.paramModesUn;
	extra.restrictModes = (typeof extra.restrictModes == 'string') ? extra.restrictModes.split('') : extra.restrictModes;
	extra.paramModes = (typeof extra.paramModes == 'string') ? extra.paramModes.split('') : extra.paramModes;
	extra.statusModes = (typeof extra.statusModes == 'string') ? extra.statusModes.split('') : extra.statusModes;
	extra.statusPrefix = (typeof extra.statusPrefix == 'string') ? extra.statusPrefix.split('') : extra.statusPrefix;
	extra.channelTypes = (typeof extra.channelTypes == 'string') ? extra.channelTypes.split('') : extra.channelTypes;
	extra.userModes = (typeof extra.userModes == 'string') ? extra.userModes.split('') : extra.userModes;
	extra.lchannels = (extra.lchannels == undefined) ? 0 : extra.lchannels;

	return extra;
};