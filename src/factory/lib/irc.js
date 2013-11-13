/*
	irc.js - Node JS IRC client library

	(C) Copyright Martyn Smith 2010
		https://github.com/martynsmith/node-irc

	This library is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This library is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this library.  If not, see <http://www.gnu.org/licenses/>.
*/

exports.Client = Client;

var net = require('net'),
	tls = require('tls'),
	util = require('util'),
	EventEmitter2 = require('eventemitter2').EventEmitter2,
	parseMessage = require('../../lib/parse').parseMessage;

function Client(opt)
{
	var self = this;

	self.timeoutRetry = 31000;
	self.retryCount = 0;
	self.throttled = false;
	self.opt = {
		hostname: '',
		server: '',
		nick: '',
		password: null,
		userName: 'ia0',
		realName: 'IRCAnywhere IRC client',
		port: 6667,
		debug: false,
		showErrors: true,
		autoRejoin: false,
		autoConnect: true,
		channels: [],
		retryCount: 10,
		retryDelay: 5000,
		secure: false,
		selfSigned: true,
		certExpired: true,
		stripColors: false,
		channelPrefixes: "&#",
		messageSplit: 510
	};

	// Features supported by the server
	// (initial values are RFC 1459 defaults. Zeros signify
	// no default or unlimited value)
	self.supported = {
		channel: {
			idlength: [],
			length: 200,
			limit: [],
			modes: {
				a: '',
				b: '',
				c: '',
				d: ''
			},
			prefixes: '',
			types: self.opt.channelPrefixes
		},
		kicklength: 0,
		maxlist: [],
		maxtargets: [],
		modes: 3,
		nicklength: 9,
		topiclength: 0,
		usermodes: '',
		name: ''
	};

	// an object to store current system state
	// messages per second, netsplit detected, etc
	self.state = {
		mps: 0,
		max_mps: 100,
		last_second: 0,
		netsplit: false,
		split: {
			hasSplit: false,
			server1: '',
			server2: '',
			timer: null,
			recon_timer: null,
			users: [],
			reconnected: []
		}
	};

	if (typeof opt == 'object')
	{
		var keys = Object.keys(opt);
		for (var i = 0; i < keys.length; i++)
		{
			var k = keys[i];
			if (opt[k] !== undefined) self.opt[k] = opt[k];
		}
	}

	// TODO - fail if nick or server missing
	// TODO - fail if username has a space in it
	if (self.opt.autoConnect === true)
		self.connect();

	// Setup an event emitter 2
	self.events = new EventEmitter2({
		wildcard: true
	});

	self.events.setMaxListeners(0);

	self.parseIncoming = function(message)
	{ // {{{
		switch (message.command)
		{
			case "ERROR":
				self.throttled = /(.*)(throttled|throttling)(.*)/i.test(message.args[0]);
				
				if (self.throttled)
					self._clearRetryTimer();
				// clear the retry timer if we're being throttled
				// because we don't want to abort if it's a throttle, we'll eventually be able to connect
				// just need to keep trying.

				self.events.emit('error', message);
				break;
			case "001":
				// Set nick to whatever the server decided it really is
				// (normally this is because you chose something too long and
				// the server has shortened it
				self.nick = message.args[0];
				self.events.emit('registered', message);
				// setup the ping timer
				self._setupPingTimer();
				break;
			case "002":
			case "003":
			case "rpl_myinfo":
				self.supported.usermodes = message.args[3];
				break;
			case "rpl_isupport":
				for (var argi in message.args)
				{
					var arg = message.args[argi],
						match;
					if (match = arg.match(/([A-Z]+)=(.*)/))
					{
						var param = match[1];
						var value = match[2];
						switch (param)
						{
							case 'NETWORK':
								self.supported.name = value;
								break;
							case 'CHANLIMIT':
								var values = value.split(',');
								for (var vali in values)
								{
									var val = values[vali].split(':');
									self.supported.channel.limit[val[0]] = parseInt(val[1]);
								}
								break;
							case 'CHANMODES':
								value = value.split(',');
								var type = ['a', 'b', 'c', 'd']
								for (var i = 0; i < type.length; i++)
								{
									self.supported.channel.modes[type[i]] += value[i];
								}
								break;
							case 'CHANTYPES':
								self.supported.channel.types = value;
								break;
							case 'CHANNELLEN':
								self.supported.channel.length = parseInt(value);
								break;
							case 'IDCHAN':
								var values = value.split(',');
								for (var vali in values)
								{
									var val = values[vali].split(':');
									self.supported.channel.idlength[val[0]] = val[1];
								}
								break;
							case 'KICKLEN':
								self.supported.kicklength = value;
								break;
							case 'MAXLIST':
								var values = value.split(',');
								for (var vali in values)
								{
									var val = values[vali].split(':');
									self.supported.maxlist[val[0]] = parseInt(val[1]);
								}
								break;
							case 'NICKLEN':
								self.supported.nicklength = parseInt(value);
								break;
							case 'PREFIX':
								if (match = value.match(/\((.*?)\)(.*)/))
								{
									match[1] = match[1].split('');
									match[2] = match[2].split('');
									while (match[1].length)
									{
										self.modeForPrefix[match[2][0]] = match[1][0];
										self.supported.channel.modes.b += match[1][0];
										self.supported.channel.prefixes += match[2][0];
										self.prefixForMode[match[1].shift()] = match[2].shift();
									}
								}
								break;
							case 'STATUSMSG':
								break;
							case 'TARGMAX':
								var values = value.split(',');
								for (var vali in values)
								{
									var val = values[vali].split(':');
									val[1] = (!val[1]) ? 0 : parseInt(val[1]);
									self.supported.maxtargets[val[0]] = val[1];
								}
								break;
							case 'TOPICLEN':
								self.supported.topiclength = parseInt(value);
								break;
						}
					}
				}
				self.events.emit('capabilities', self.supported, message);
				break;
			case "rpl_luserclient":
			case "rpl_luserop":
			case "rpl_luserchannels":
			case "rpl_luserme":
			case "rpl_localusers":
			case "rpl_globalusers":
			case "rpl_statsconn":
				// Random welcome crap, ignoring
				break;
			case "rpl_hosthidden":
				self.opt.hostname = message.args[1];
				break;
			case "err_nicknameinuse":
				if (typeof (self.opt.nickMod) == 'undefined')
					self.opt.nickMod = 0;

				self.opt.nickMod++;
				self.send("NICK", self.opt.nick + self.opt.nickMod);
				self.nick = self.opt.nick + self.opt.nickMod;
				break;
			case "PONG":
				clearTimeout(self._disconnectTimer);
				break;
			case "PING":
				self.send("PONG", message.args[0]);
				self.events.emit('ping', message.args[0]);
				self._lastPing = +new Date();
				break;
			case "NOTICE":
				self.rateLimit(message.command);
				// process flooding attempt
				var from = message.nick;
				var to = message.args[0];
				if (!to)
				{
					to = null;
				}
				var text = message.args[1];
				if (text == undefined)
					break;

				if (text[0] === '\1' && text.lastIndexOf('\1') > 0)
				{
					self._handleCTCP(from, to, text, 'notice');
					break;
				}
				self.events.emit('notice', from, to, text, message);

				if (self.opt.debug && to == self.nick) util.log('GOT NOTICE from ' + (from ? '"' + from + '"' : 'the server') + ': "' + text + '"');
				break;
			case "MODE":
				if (self.opt.debug)
					util.log("MODE:" + message.args[0] + " sets mode: " + message.args[1]);

				var channel = self.chanData(message.args[0]);
				if (!channel)
					break;
				
				self.events.emit('mode', message.args[0], message.nick, message.args.slice(1).join(' '), message);
				break;
			case "NICK":
				if (message.nick == self.nick)
				// the user just changed their own nick
				self.nick = message.args[0];

				if (self.opt.debug)
					util.log("NICK: " + message.nick + " changes nick to " + message.args[0]);

				var channels = [];

				// TODO better way of finding what channels a user is in?
				for (var channame in self.chans)
				{
					var channel = self.chans[channame];
					if ('string' == typeof channel.users[message.nick])
					{
						channel.users[message.args[0]] = channel.users[message.nick];
						delete channel.users[message.nick];
						channels.push(channame);
					}
				}

				// old nick, new nick, channels
				self.events.emit('nick', message.nick, message.args[0], channels, message);
				break;
			case "rpl_motdstart":
				self.motd = [message.args[1]];
				break;
			case "rpl_motd":
				self.motd.push(message.args[1]);
				break;
			case "rpl_endofmotd":
			case "err_nomotd":
				self.motd = [message.args[1]];
				self.events.emit('motd', self.motd);
				break;
			case "rpl_namreply":
				var channel = self.chanData(message.args[2]);
				var users = message.args[3].trim().split(/ +/);
				if (channel)
				{
					for (var uid in users)
					{
						var user = users[uid],
							match = user.match(/^(.)(.*)$/);
						if (match)
						{
							if (match[1] in self.modeForPrefix)
								channel.users[match[2]] = match[1];
							else
								channel.users[match[1] + match[2]] = '';
						}
					}
				}
				break;
			case "rpl_endofnames":
				var channel = self.chanData(message.args[1]);
				if (channel)
				{
					self.events.emit('names', message.args[1], channel.users);
					self.events.emit('names' + message.args[1], channel.users);
					self.send('MODE', message.args[1]);
				}
				break;
			case "rpl_topic":
				var channel = self.chanData(message.args[1]);
				if (channel)
				{
					channel.topic = message.args[2];
				}
				break;
			case "rpl_away":
				self._addWhoisData(message.args[1], 'away', message.args[2]);
				break;
			case "rpl_whoisuser":
				self._addWhoisData(message.args[1], 'user', message.args[2]);
				self._addWhoisData(message.args[1], 'host', message.args[3]);
				self._addWhoisData(message.args[1], 'realname', message.args[5]);
				break;
			case "rpl_whoisidle":
				self._addWhoisData(message.args[1], 'idle', message.args[2]);
				break;
			case "rpl_whoischannels":
				self._addWhoisData(message.args[1], 'channels', message.args[2].trim().split(/\s+/)); // TODO - clean this up?
				break;
			case "rpl_whoisserver":
				self._addWhoisData(message.args[1], 'server', message.args[2]);
				self._addWhoisData(message.args[1], 'serverinfo', message.args[3]);
				break;
			case "rpl_whoismodes":
				self._addWhoisData(message.args[1], 'modes', message.args[2])
				break;
			case "rpl_whoishost":
				self._addWhoisData(message.args[1], 'host', message.args[2])
				break;
			case "rpl_whoisadmin":
				self._addWhoisData(message.args[1], 'operator', message.args[2]);
				break;
			case "rpl_whoisoperator":
				self._addWhoisData(message.args[1], 'operator', message.args[2]);
				break;
			case "rpl_whoishelpop":
				self._addWhoisData(message.args[1], 'helpop', message.args[2]);
				break;
			case "rpl_whoisbot":
				self._addWhoisData(message.args[1], 'bot', message.args[2]);
				break;
			case "rpl_whoisspecial":
				self._addWhoisData(message.args[1], 'special', message.args[2]);
				break;
			case "rpl_whoissecure":
				self._addWhoisData(message.args[1], 'secure', message.args[2]);
				break;
			case "rpl_whoisaccount":
				self._addWhoisData(message.args[1], 'account', message.args[2]);
				self._addWhoisData(message.args[1], 'accountinfo', message.args[3]);
				break;
			case "rpl_whoissecure":
				self._addWhoisData(message.args[1], 'secure', message.args[2]);
				break;
			case "rpl_endofwhois":
				self.events.emit('whois', self._getWhoisData(message.args[1]));
				self._clearWhoisData(message.args[1]);
				break;
			case "rpl_whoreply":
				var channel = self.chanData(message.args[1]);
				if (channel)
				{
					var extra = (message.args[6] == undefined) ? '' : message.args[6];
					self.events.emit('whoreply', message.args[1], message.args[2] + '@' + message.args[3], message.args[5], extra, message);
				}
				break;
			case "rpl_endofwho":
				var channel = self.chanData(message.args[1]);
				if (channel)
					self.events.emit('endofwho', message.args[1]);
				break;
			case "rpl_liststart":
				self.channellist = [];
				self.events.emit('channellist_start');
				break;
			case "rpl_list":
				var channel = {
					name: message.args[1],
					users: message.args[2],
					topic: message.args[3],
				};
				self.events.emit('channellist_item', channel);
				self.channellist.push(channel);
				break;
			case "rpl_listend":
				self.events.emit('channellist', self.channellist);
				break;
			case "333":
				// TODO emit?
				var channel = self.chanData(message.args[1]);
				if (channel)
				{
					channel.topicBy = message.args[2];
					// channel, topic, nick
					self.events.emit('topic', message.args[1], channel.topic, channel.topicBy, message);
				}
				break;
			case "TOPIC":
				// channel, topic, nick
				self.events.emit('topic', message.args[0], message.args[1], message.nick, message);

				var channel = self.chanData(message.args[0]);
				if (channel)
				{
					channel.topic = message.args[1];
					channel.topicBy = message.nick;
				}
				break;
			case "rpl_channelmodeis":
				var channel = self.chanData(message.args[1]);
				if (channel)
				{
					channel.mode = message.args[2];
				}
				self.events.emit('mode', message.args[1], message.server, message.args.slice(2).join(' '), message);
				break;
			case "329":
				var channel = self.chanData(message.args[1]);
				if (channel)
					channel.created = message.args[2];
				break;
			case "JOIN":
				// channel, who
				if (self.nick == message.nick)
				{
					self.chanData(message.args[0], true);
				}
				else
				{
					var channel = self.chanData(message.args[0], true);
					channel.users[message.nick] = '';
				}

				var index = self.state.split.users.indexOf(message.nick);
				if (self.state.split.hasSplit && index > -1)
				{
					self.state.split.reconnected.push(message.nick);

					clearTimeout(self.state.split.recon_timer);
					// clear an existing timer and set it again
					
					self.state.split.recon_timer = setTimeout(function ()
					{
						self.events.emit('netsplit_reconnected', +new Date(), self.state.split.server1, self.state.split.server2, self.state.split.users, self.state.split.reconnected);
						self.state.netsplit = false;
						self.state.split.hasSplit = false;
						self.state.split.server1 = self.state.split.server2 = '';
						self.state.split.users.length = self.state.split.reconnected.length = 0;
					}, 1000);
					// set a timer to figure out when the netsplit has finished, we wait 1.5 seconds max
				}
				// work out if these are rejoins from a split user

				self.events.emit('join', message.args[0], message.nick, message);
				self.events.emit('join' + message.args[0], message.nick, message);
				
				if (message.args[0] != message.args[0].toLowerCase())
					self.events.emit('join' + message.args[0].toLowerCase(), message.nick, message);
				break;
			case "PART":
				// channel, who, reason
				self.events.emit('part', message.args[0], message.nick, message.args[1], message);
				self.events.emit('part' + message.args[0], message.nick, message.args[1], message);
				if (message.args[0] != message.args[0].toLowerCase())
				{
					self.events.emit('part' + message.args[0].toLowerCase(), message.nick, message.args[1], message);
				}
				if (self.nick == message.nick)
				{
					var channel = self.chanData(message.args[0], true);
					delete self.chans[channel.key];
				}
				else
				{
					var channel = self.chanData(message.args[0], true);
					delete channel.users[message.nick];
				}
				break;
			case "KICK":
				// channel, who, by, reason
				self.events.emit('kick', message.args[0], message.args[1], message.nick, message.args[2], message);
				self.events.emit('kick' + message.args[0], message.args[1], message.nick, message.args[2], message);
				if (message.args[0] != message.args[0].toLowerCase())
				{
					self.events.emit('kick' + message.args[0].toLowerCase(), message.args[1], message.nick, message.args[2], message);
				}

				if (self.nick == message.args[1])
				{
					var channel = self.chanData(message.args[0], true);
					delete self.chans[channel.key];
				}
				else
				{
					var channel = self.chanData(message.args[0], true);
					delete channel.users[message.args[1]];
				}
				break;
			case "KILL":
				var nick = message.args[0];
				var channels = [];
				for (var channel in self.chans)
				{
					if (self.chans[channel].users[nick])
						channels.push(channel);

					delete self.chans[channel].users[nick];
				}
				self.events.emit('kill', nick, message.args[1], channels, message);
				break;
			case "PRIVMSG":
				self.rateLimit(message.command);
				// process flooding attempt
				var from = message.nick;
				var to = message.args[0];
				var text = message.args[1];
				if (text[0] === '\1' && text.lastIndexOf('\1') > 0)
				{
					self._handleCTCP(from, to, text, 'privmsg');
					break;
				}
				self.events.emit('message', from, to, text, message);
				if (self.supported.channel.types.indexOf(to.charAt(0)) !== -1)
				{
					self.events.emit('message#', from, to, text, message);
					self.events.emit('message' + to, from, text, message);
					if (to != to.toLowerCase())
					{
						self.events.emit('message' + to.toLowerCase(), from, text, message);
					}
				}
				if (to == self.nick)
					self.events.emit('pm', from, text, message);

				if (self.opt.debug && to == self.nick)
					util.log('GOT MESSAGE from ' + from + ': ' + text);
				break;
			case "INVITE":
				var from = message.nick;
				var to = message.args[0];
				var channel = message.args[1];
				self.events.emit('invite', channel, from, message);
				break;
			case "QUIT":
				if (self.opt.debug) util.log("QUIT: " + message.prefix + " " + message.args.join(" "));
				if (self.nick == message.nick || message.args[0] == undefined)
				{
					// TODO handle?
					break;
				}
				// handle other people quitting

				var channels = [],
					match = message.args[0].match(/^([^ @!\"\n]+\.[^ @!\n]+) ([^ @!\"\n]+\.[^ @!\n]+)$/);

				// try to figure out if this is a netsplit
				if (!self.state.netsplit && match != null)
				{
					self.state.netsplit = true;
					self.state.split.server1 = match[1],
					self.state.split.server2 = match[2];
					self.state.split.users.push(message.nick);
					self.events.emit('netsplit_detect', +new Date(), self.state.split.server1, self.state.split.server2);
				}
				else if (self.state.netsplit && match != null)
				{
					self.state.split.users.push(message.nick);
					clearTimeout(self.state.split.timer);
					// clear an existing timer and set it again
					self.state.split.timer = setTimeout(function ()
					{
						self.events.emit('netsplit_finished', +new Date(), self.state.split.server1, self.state.split.server2, self.state.split.users);
						self.state.netsplit = false;
						self.state.split.hasSplit = true;
					}, 1000);
					// set a timer to figure out when the netsplit has finished, we wait 1.5 seconds max
				}
				// currently net splitting

				// TODO better way of finding what channels a user is in?
				for (var channame in self.chans)
				{
					var channel = self.chans[channame];
					if ('string' == typeof channel.users[message.nick])
					{
						delete channel.users[message.nick];
						channels.push(channame);
					}
				}

				// who, reason, channels
				self.events.emit('quit', message.nick, message.args[0], channels, message);
				break;
			case "err_umodeunknownflag":
				if (self.opt.debug && self.opt.showErrors) util.log("ERROR: " + message.line);
				break;
			default:
				if (message.commandType == 'error')
				{
					self.events.emit('err', message, false);
					if (self.opt.debug && self.opt.showErrors)
						util.log("ERROR: " + message.line);
				}
				else
				{
					if (self.opt.debug)
						util.log("Unhandled message: " + message.line);
				}
				break;
		}
	};

	self.events.addListener("raw", self.parseIncoming);
	// parse raw events

	self.events.addListener('kick', function (channel, who, by, reason)
	{
		if (self.opt.autoRejoin)
			self.send.apply(self, ['JOIN'].concat(channel.split(' ')));
	});
	self.events.addListener('motd', function (motd)
	{
		self.opt.channels.forEach(function (channel)
		{
			self.send.apply(self, ['JOIN'].concat(channel.split(' ')));
		});
	});
};

Client.prototype.conn = null;
Client.prototype.prefixForMode = {};
Client.prototype.modeForPrefix = {};
Client.prototype.chans = {};
Client.prototype._whoisData = {};
Client.prototype.chanData = function (name, create)
{ // {{{
	var key = name.toLowerCase();
	if (create)
	{
		this.chans[key] = this.chans[key] || {
			key: key,
			serverName: name,
			users: {},
			mode: '',
		};
	}

	return this.chans[key];
} // }}}
Client.prototype.rateLimit = function (command)
{ // {{{
	var self = this,
		second = Math.round(+new Date() / 1000),
		diff = second - self.state.last_second;
		// get current second, and last second

	if (diff == 0)
	{
		self.state.mps++;
		// up the data

		if (self.state.mps >= self.state.max_mps)
			self.disconnect('Flood protection');
		// socket is most likely being flooded
	}
	else
	{
		self.state.mps = 0;
		self.state.last_second = second;
		// reset data
	}
} // }}}
Client.prototype.connect = function (callback)
{ // {{{
	var self = this;

	if (self.retryCount == undefined)
		self.retryCount = 0;
	
	if (self.opt.retryCount !== null)
		self.retryCount++;

	if (typeof (callback) === 'function')
		self.events.once('registered', callback);
	
	self.opt.nickMod = 0;
	self.chans = {};
	self.disconnect('');

	// try to connect to the server
	if (self.opt.secure)
	{
		var creds = self.opt.secure;
		if (typeof self.opt.secure !== 'object')
			creds = {
				rejectUnauthorized: false
			};

		self.conn = tls.connect(self.opt.port, self.opt.server, creds, function ()
		{
			self.events.emit('socketinfo', this.address());

			// callback called only after successful socket connection
			self.conn.connected = true;
			if (self.conn.authorized || (self.opt.selfSigned && (self.conn.authorizationError === 'DEPTH_ZERO_SELF_SIGNED_CERT' || self.conn.authorizationError === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || self.conn.authorizationError === 'Hostname/IP doesn\'t match certificate\'s altnames')) || (self.opt.certExpired && self.conn.authorizationError === 'CERT_HAS_EXPIRED'))
			{
				// authorization successful
				self.conn.setEncoding('utf-8');

				if (self.opt.certExpired && self.conn.authorizationError === 'CERT_HAS_EXPIRED' && self.opt.debug)
					util.log('Connecting to server with expired certificate');

				if (self.opt.password !== null)
					self.send("PASS", self.opt.password);

				if (self.opt.debug)
					util.log('Sending irc NICK/USER');

				self.send("NICK", self.opt.nick);
				self.nick = self.opt.nick;
				self.send("USER", self.opt.userName, 8, "*", self.opt.realName);
				self.events.emit("connect");
			}
			else
			{
				// authorization failed
				if (self.opt.debug)
					util.log(self.conn.authorizationError);
			}
		});
	}
	else
	{
		self.conn = net.createConnection(self.opt.port, self.opt.server, function()
		{
			self.events.emit('socketinfo', this.address());
		});
	}

	self.conn.requestedDisconnect = false;
	self.conn.setTimeout(0);
	self.conn.setEncoding('utf8');

	self.conn.addListener("connect", function ()
	{
		if (self.opt.password !== null)
			self.send("PASS", self.opt.password);

		self.send("NICK", self.opt.nick);
		self.nick = self.opt.nick;
		self.send("USER", self.opt.userName, 8, "*", self.opt.realName);
		self.events.emit("connect");
	});

	self._lastPing = +new Date();
	var buffer = '';

	self.conn.addListener("data", function (chunk)
	{
		buffer += chunk;
		var lines = buffer.split("\r\n");
		buffer = lines.pop();
		lines.forEach(function (line)
		{
			var message = parseMessage(line, self.opt.stripColors);
			self.events.emit('raw', message);
		});
	});

	self.conn.addListener("end", function ()
	{
		if (self.opt.debug)
			util.log('Connection got "end" event');
	});

	self.conn.addListener("close", function ()
	{
		self.events.emit('close');
		
		if (self.opt.debug)
			util.log('Connection got "close" event');

		if (self.conn != null && self.conn.requestedDisconnect)
			return;

		if (self.opt.debug)
			util.log('Disconnected: reconnecting');

		if (self.opt.retryCount !== null && self.retryCount >= self.opt.retryCount)
		{
			if (self.opt.debug)
				util.log('Maximum retry count (' + self.opt.retryCount + ') reached. Aborting');

			self.events.emit('abort', self.opt.retryCount);
			return;
		}

		retryDelay = (self.throttled) ? self.timeoutRetry : self.opt.retryDelay;

		if (self.opt.debug)
			util.log('Waiting ' + retryDelay + 'ms before retrying');

		self._retryTimer = setTimeout(function () {
			self.connect();
		}, retryDelay);
	});

	self.conn.addListener("error", function (exception)
	{
		if (self.opt.debug)
			util.log('Connection got "error" event with exception: ' + exception);
		
		if (exception.message.match(/ETIMEDOUT/))
		{
			if (self.opt.debug)
				util.log("Responding to ETIMEDOUT socket error by disconnecting, reconnecting");
			
			self.disconnect('Disconnecting because of socket ETIMEDOUT');
			self._retryTimer = setTimeout(function() {
				self.connect(self.retryCount + 1);
			}, self.opt.retryDelay);
		}
		else
		{
			self.events.emit("netError", exception);
		}
	});
}; // }}}
Client.prototype.disconnect = function (message, callback)
{ // {{{
	var self = this;
	
	if (typeof (message) === 'function')
	{
		callback = message;
		message = undefined;
	}

	if (self.conn != undefined)
	{
		message = message || "node-irc says goodbye";
		if (self.conn.readyState == 'open')
		{
			self.send("QUIT", message);
		}
		self.conn.requestedDisconnect = true;
		if (typeof (callback) === 'function')
		{
			self.conn.once('end', callback);
		}
		self.events.emit('end');
		self.conn.end();
		delete self.conn;
	}
	else
	{
		if (typeof (callback) === 'function')
		{
			callback();
		}
	}
}; // }}}
Client.prototype.ping = function (command)
{ // {{{
	var self = this,
		now = +new Date();

	self.send('PING', 'LAG' + now);
	self._disconnectTimer = setTimeout(function ()
	{
		var now = +new Date();

		self.send('PING', 'LAG' + now);
		self._disconnectTimer = setTimeout(function ()
		{	
			self.disconnect('Ping timeout');
			self.events.emit('timeout');

		}, 20000);
		
	}, 20000);
	// we send an initial PING, if we haven't got a reply within 20 seconds
	// we try again, if we havent got a reply within another 20 seconds we
	// emit an event telling the factory the socket has died, and close it.
}; // }}}
Client.prototype.send = function (command)
{ // {{{
	var self = this,
		a = arguments,
		args = Array.prototype.slice.call(a);
	// Note that the command arg is included in the args array as the first element

	if (args[0] == 'PRIVMSG' || args[0] == 'NOTICE')
	{
		var part1 = args[0] + ' ' + args[1] + ' :',
			text = ':' + self.nick + '!' + self.opt.userName + '@' + self.opt.hostname + ' ' + args.join(' '),
			start = ':' + self.nick + '!' + self.opt.userName + '@' + self.opt.hostname + ' ' + args[0] + ' ' + args[1] + ' :',
			message = parseMessage(':' + self.nick + '!' + self.opt.userName + '@' + self.opt.hostname + ' ' + args.join(' '), self.opt.stripColors);

		text.toString().split(/\r?\n/).filter(function (line)
		{
			return line.length > 0;

		}).forEach(function (line)
		{
			var r = text.match(new RegExp('(.{' + start.length + ',' + self.opt.messageSplit + '})(?:\s|$)', 'g'));
			
			for (var part in r)
			{
				var newText = (part == 0) ? part1 + r[part].substr(start.length).trim() : part1 + r[part].trim();
				self.raw(newText.trim());
				// send the cut data

				var newMessage = parseMessage(':' + self.nick + '!' + self.opt.userName + '@' + self.opt.hostname + ' ' + newText, self.opt.stripColors)
				// create a new message object

				self.parseIncoming(newMessage);
				self.events.emit('raw', newMessage);
				// send the new message object out
			}
		});
	}
	// if the command is a PRIVMSG or a NOTICE, output it like it's incoming
	else
	{
		self.raw(args.join(' '));
	}
	// offload it to the raw command, this way we use only one .write()
}; // }}}
Client.prototype.raw = function (command)
{ // {{{
	var self = this;
	
	if (self.opt.debug)
	{
		util.log('SEND: ' + command);
	}

	if (self.conn != undefined && !self.conn.requestedDisconnect)
	{
		self.conn.write(command + "\r\n");
	}
}; // }}}
Client.prototype.join = function (channel, callback)
{ // {{{
	var self = this;

	self.events.once('join' + channel, function ()
	{
		// if join is successful, add the channel to opts.channels
		// so that it will be re-joined upon reconnect (as channels
		// specified in options are)
		if (self.opt.channels.indexOf(channel) == -1)
		{
			self.opt.channels.push(channel);
		}

		if (typeof (callback) == 'function')
		{
			return callback.apply(self, arguments);
		}
	});

	self.send.apply(self, ['JOIN'].concat(channel.split(' ')));
} // }}}
Client.prototype.part = function (channel, callback)
{ // {{{
	var self = this;
	
	if (typeof (callback) == 'function')
	{
		self.events.once('part' + channel, callback);
	}

	// remove this channel from this.opt.channels so we won't rejoin
	// upon reconnect
	if (self.opt.channels.indexOf(channel) != -1)
	{
		self.opt.channels.splice(self.opt.channels.indexOf(channel), 1);
	}

	self.send('PART', channel);
} // }}}
Client.prototype.say = function (target, text)
{ // {{{
	var self = this;
	
	self.send('PRIVMSG', target, text);
} // }}}
Client.prototype.notice = function (target, text)
{ // {{{
	var self = this;
	
	self.send('NOTICE', target, text);
} // }}}
Client.prototype.whois = function (nick, callback)
{ // {{{
	var self = this;
	
	if (typeof callback === 'function')
	{
		var callbackWrapper = function (info)
		{
			if (info.nick == nick)
			{
				self.events.removeListener('whois', callbackWrapper);
				return callback.apply(self, arguments);
			}
		};
		self.events.addListener('whois', callbackWrapper);
	}
	self.send('WHOIS', nick);
} // }}}
Client.prototype.list = function ()
{ // {{{
	var self = this,
		a = arguments,
		args = Array.prototype.slice.call(a, 0);

	args.unshift('LIST');
	self.send.apply(self, args);
} // }}}
Client.prototype._addWhoisData = function (nick, key, value, onlyIfExists)
{ // {{{
	var self = this;
	
	nick = nick.toLowerCase();
	if (onlyIfExists && !self._whoisData[nick]) return;
	self._whoisData[nick] = self._whoisData[nick] || {
		nick: nick
	};
	self._whoisData[nick][key] = value;
} // }}}
Client.prototype._getWhoisData = function (_nick)
{ // {{{
	// Ensure that at least the nick exists before trying to return
	nick = _nick.toLowerCase();
	this._addWhoisData(nick, 'nick', _nick);
	return this._whoisData[nick];
} // }}}
Client.prototype._clearWhoisData = function (nick)
{ // {{{
	nick = nick.toLowerCase();
	delete this._whoisData[nick];
} // }}}
Client.prototype._setupPingTimer = function ()
{ // {{{
	var self = this;
	
	self._pingTimer = setTimeout(function ()
	{
		var now = +new Date(),
			since = Math.round((now - self._lastPing) / 1000);
		
		if (since >= 300)
		{
			self.ping();
		}

		self._setupPingTimer();
	}, 30000);
} // }}}
Client.prototype._clearRetryTimer = function ()
{ // {{{
	var self = this;
	
	clearTimeout(self._retryTimer);
	self.retryCount = 0;
	self._retryTimer = setTimeout(function() {
		self.connect();
	}, self.timeoutRetry);
} // }}}
Client.prototype._handleCTCP = function (from, to, text, type)
{
	var self = this;
	
	text = text.slice(1);
	text = text.slice(0, text.indexOf('\1'));
	var parts = text.split(' ');

	self.events.emit('ctcp', from, to, text, type);
	self.events.emit('ctcp-' + type, from, to, text);

	if (type === 'privmsg' && text === 'VERSION')
		self.events.emit('ctcp-version', from, to);

	if (parts[0] === 'ACTION' && parts.length > 1)
		self.events.emit('action', from, to, parts.slice(1).join(' '));

	if (parts[0] === 'PING' && type === 'privmsg' && parts.length > 1)
		self.ctcp(from, 'notice', text);
}
Client.prototype.ctcp = function (to, type, text)
{
	return this[type === 'privmsg' ? 'say' : 'notice'](to, '\1' + text + '\1');
}
Client.prototype.destroy = function (callback)
{
	var self = this;
	
	self.conn.requestedDisconnect = true;
	self.disconnect('Disconnecting');
	// disconnect the client, just to make sure all sockets etc are closed properly

	if (self._pingTimer !== undefined)
		clearTimeout(self._pingTimer);
	
	if (self._retryTimer !== undefined)
		clearTimeout(self._retryTimer);

	if (self._disconnectTimer !== undefined)
		clearTimeout(self._disconnectTimer);
	// clear our timers

	self.events.removeAllListeners();
	// remove all listeners

	setTimeout(callback, 1000);
}
