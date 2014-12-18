/**
 * IRCAnywhere server/serversession.js
 *
 * @title ServerSession
 * @copyright (c) 2013-2014 http://ircanywhere.com
 * @license GPL v2
 * @author Rodrigo Silveira
 */

var parseMessage = require('irc-message').parseMessage,
	_ = require('lodash'),
	moment = require('moment'),
	helper = require('../lib/helpers').Helpers,
	Q = require('q'),
	hooks = require('hooks');

/**
 * Handles the communication between an IRC client and ircanywhere's IRC server. Instantiated on
 * every new client connection.

 * @class ServerSession
 * @method ServerSession
 * @param {Object} socket Connection socket to the client
 * @return void
 */
function ServerSession(socket) {
	this.socket = socket;
	this.id = Math.floor(Math.random() * 1e10).toString(10);
	// Random id for this session

	application.logger.log('info', 'New client connection. id=', this.id);

	this.welcomed = false;

	this.init();
}

/**
 * @member {Boolean} debug A flag to determine whether debug logging is enabled or not
 */
ServerSession.debug = (process.env.DEBUG_SERVER && process.env.DEBUG_SERVER === 'true');

/**
 * Initializes session.
 *
 * @method init
 * @return void
 */
ServerSession.prototype.init = function() {
	var self = this;

	this.socket.on('data', function(data) {
		var lines = data.toString().split('\r\n');
		// One command por line

		lines.pop();
		// last line will be blank, ignore

		lines.forEach(function(line) {
			var message = parseMessage(line),
				command = message.command.toLowerCase();

			if (ServerSession.debug) {
				console.log(new Date().toJSON(), 'from client -', line);
			}

			if (self[command]) {
				self[command](message);
				// Handle some events internally
			} else {
				self.onClientMessage(message, command);
				// Handle everything else.
			}
		});
	});
	// Handle data received from client

	this.socket.on('error', function(error) {
		application.logger.log('error', 'error with client connection to IRC server');
		application.handleError(error, false);
		self.socket.end();
	});

	this.socket.on('close', function() {
		application.logger.log('info', 'Client disconnected. id=', self.id);

		if (self.networkId) {
			application.db.update('networks', {_id: self.networkId}, {$set: {clientConnected: false}});
		}

		process.nextTick(function () {
			self.socket.removeAllListeners();
			delete self.socket;
		});
		// Clean up the socket but give a chance to other close event handlers to run first
	});
};

/**
 * Handles PASS message from client. Stores password for login.
 *
 * @method pass
 * @param {Object} message Received message
 * @return void
 */
ServerSession.prototype.pass = function(message) {
	this.password = message.params[0];
	// PASS message should be the first, before USER or NICK.
};

/**
 * Handles NICK message from client. If message arrives before welcome, just store nickname temporarily to use
 * on the welcome message. Otherwise forward it.
 *
 * @method nick
 * @param {Object} message Received message
 * @return void
 */
ServerSession.prototype.nick = function(message) {
	if (!this.welcomed) {
		this.clientNick = message.params[0];
		// first nick, just store it locally for the welcome msg.
	} else {
		this.onClientMessage(message, 'nick');
	}
};

/**
 * Handles QUIT message from client. Disconnects the user.
 *
 * @method quit
 * @return void
 */
ServerSession.prototype.quit = function() {
	this.sendRaw('ERROR :Quitting');
	this.disconnectUser();
};

/**
 * Disconnects the socket.
 *
 * @return void
 */
ServerSession.prototype.disconnectUser = function() {
	this.socket.end();
};

/**
 * Handles USER message from client. Start login sequence. Username should contain network information if
 * more then one network is registered. Username with network is in the form:
 *
 * 	user@email.com/networkName
 *
 * @method user
 * @param {Object} message Received message
 * @return void
 */
ServerSession.prototype.user = function(message) {
	var self = this,
		params = message.params[0].split('/'),
		email = params[0],
		networkName = params[1];

	userManager.loginServerUser(email, self.password)
		.then(function(user) {
			self.user = user;
			self.email = email;

			return networkManager.getClientsForUser(user._id);
		})
		.then(function(networks) {
			if (!networks || networks.length === 0) {
				return Q.reject('No active network found');
			}

			if (networks.length === 1) {
				self.networkId = networks[0]._id;
				// if only one network, choose it
			} else {
				if (!networkName) {
					return Q.reject('Network not defined, please specify network after username. Example: ' +
						email + '/' + networks[0].name + '.');
				}

				var network = _.find(networks, {name: networkName});

				if (!network) {
					return Q.reject('Network ' + networkName + ' not found.');
				}

				self.networkId = network._id;
			}

			self.setup();
			return self.sendWelcome()
				.fail(function(error){
					application.handleError(error, false);
					self.disconnectUser();

					return Q.reject('Error registering user');
				});
		})
		.then(function () {
			return self.sendJoins();
		})
		.then(function () {
			self.sendPlayback();
		})
		.fail(function(error) {
			application.logger.log('error', 'Error login in user ' + email + ': ' + error);
			self.sendRaw(':***!ircanywhere@ircanywhere.com PRIVMSG ' + self.clientNick + ' :' + error);
			self.sendRaw(':***!ircanywhere@ircanywhere.com 464 ' + self.clientNick + ' :' + error);
			// Send a private message and 464 ERR_PASSWDMISMATCH with error description when login fails

			self.disconnectUser();
		});
};

/**
 * Sets up client to listen to IRC activity.
 *
 * @method setup
 * @return void
 */
ServerSession.prototype.setup = function() {
	var eventsCallback = this.handleEvent.bind(this),
		ircMessageCallback = this.handleIrcMessage.bind(this);

	application.ee.on(['events', 'insert'], eventsCallback);
	ircFactory.events.on('message', ircMessageCallback);

	application.db.update('networks', {_id: this.networkId}, {$set: {clientConnected: true}});

	this.socket.on('close', function() {
		application.ee.removeListener(['events', 'insert'], eventsCallback);
		ircFactory.events.removeListener('message', ircMessageCallback);
	}.bind(this));
};

/**
 * Handle IRC events.
 *
 * @method handleEvent
 * @param {Object} event Event to handle
 * @return void
 */
ServerSession.prototype.handleEvent =  function(event) {
	var ignore = ['registered', 'lusers', 'motd', 'join'];

	if (event.message.clientId === this.id) {
		return;
	}
	// Don't duplicate events.

	if (event.network.toString() !== this.networkId.toString()) {
		return;
	}
	// Check network

	if (_.contains(ignore, event.type)) {
		return;
	}
	// Is in the ignore list

	if (!event.user.equals(this.user._id)) {
		return;
	}
	// not for me

	if (event.type === 'privmsg') {
		userManager.updateLastSeen(this.user._id);
	}

	this.sendRaw(event.message.raw);
	// Sent to client
};

/**
 * Forwards messages that are not stored in the events collection in the database.
 *
 * @method handleIrcMessage
 * @param {Object} ircMessage Irc Message object
 * @return void
 */
ServerSession.prototype.handleIrcMessage = function (ircMessage) {
	var fwdMessages = ['names', 'who', 'whois', 'mode', 'banList', 'inviteList', 'exceptlist', 'quietlist', 'list', 'join'],
		clientKey = ircMessage.event[0].toString(),
		command = ircMessage.event[1],
		message = ircMessage.message;

	if (this.networkId.toString() !== clientKey) {
		return;
	}
	// Check if it's the right network.

	if (_.contains(fwdMessages, command)) {
		this.sendRaw(message.raw);
		// Sent to client
	}
};

/**
 * Sends stored welcome message from network to client. Message order is registered, lusers,
 * nick (to set to stored nick), motd and usermode.
 *
 * @method sendWelcome
 * @return {promise}
 */
ServerSession.prototype.sendWelcome = function () {
	var self = this,
		network = Clients[this.networkId.toString()];

	// Change nick on messages and send them.
	function _sendWelcomeMessageToNick(rawMessages, nick) {
		nick = nick || network.nick;

		function setNick(rawMessage) {
			var message = new parseMessage(rawMessage);

			message.params[0] = nick;

			return message.toString();
		}

		if (_.isArray(rawMessages)) {
			rawMessages.forEach(function(rawMessage) {
				self.sendRaw(setNick(rawMessage));
			});
		} else {
			self.sendRaw(setNick(rawMessages));
		}
	}

	return eventManager.getEventByType('registered', self.networkId, self.user._id)
		.then(function (event) {
			if (event) {
				_sendWelcomeMessageToNick(event.message.raw, self.clientNick);
			}

			return eventManager.getEventByType('lusers', self.networkId, self.user._id);
		})
		.then(function (event) {
			if (event) {
				_sendWelcomeMessageToNick(event.message.raw, self.clientNick);
			}

			if (self.clientNick !== network.nick) {
				self.sendRaw(':' + self.clientNick + ' NICK :' + network.nick);
			}
			// Change nick on client to what we have on the network.

			return eventManager.getEventByType('motd', self.networkId, self.user._id);
		})
		.then(function (event) {
			if (event) {
				_sendWelcomeMessageToNick(event.message.raw);
			}

			return eventManager.getEventByType('usermode', self.networkId, self.user._id);
		})
		.then(function (event) {
			if (event) {
				var message = parseMessage(event.message.raw);

				message.prefix = network.nick;
				message.params[0] = network.nick;

				self.sendRaw(message.toString());
			}

			self.welcomed = true;
		})
		.fail(function (error) {
			application.logger.log('error', 'error registering client to IRC server');
			application.handleError(error, false);
		});
};

/**
 * Sends to client a join message for each active channel tab.
 *
 * @method sendJoins
 * @return {promise}
 */
ServerSession.prototype.sendJoins = function () {
	var self = this,
		network = Clients[this.networkId.toString()];

	return networkManager.getActiveChannelsForUser(self.user._id, self.networkId)
		.then(function (tabs) {
			return Q.all(tabs.map(function (tab) {
				var prefix = '',
					deferred = Q.defer();

				application.db.find('events', {type: 'join', 'extra.self': true, network: self.networkId, user: self.user._id, target: tab.target}).sort({'message.time': -1}).limit(1).nextObject(function(err, event) {
					if (err || !event) {
						deferred.reject(err);
						return;
					}

					var message = parseMessage(event.message.raw),
						hostmask = message.parseHostmaskFromPrefix();

					message.prefix = network.nick;

					if (hostmask.username) {
						message.prefix += '!' + hostmask.username;
					}

					if (hostmask.hostname) {
						message.prefix += '@' + hostmask.hostname;
					}

					prefix = message.prefix;
					self.sendRaw(message.toString());

					self.sendChannelInfo(tab);

					deferred.resolve();
				});

				return deferred.promise;
			}));
		});
};

/**
 * Sends channel information, such as NAMES, TOPIC etc
 *
 * @method sendChannelInfo
 * @param {Object} tab Channel tab
 * @return void
 */
ServerSession.prototype.sendChannelInfo = function (tab) {
	var network = Clients[this.networkId.toString()];

	if (typeof tab.topic === 'object') {
		this.sendRaw(':' + network.server + ' 332 ' + network.nick + ' ' + tab.target + ' :' + tab.topic.topic);
		this.sendRaw(':' + network.server + ' 333 ' + network.nick + ' ' + tab.target + ' ' + tab.topic.setter + ' ' + (+new Date() / 1000));
	}
	// send topic

	ircFactory.send(this.networkId.toString(), 'raw', ['NAMES', tab.target]);
	// send NAMES
};

/**
 * Sends playback messages to client.
 *
 * @method sendPlayback
 * @return void
 */
ServerSession.prototype.sendPlayback = function () {
	var self = this,
		channelsSent = {},
		network = Clients[this.networkId.toString()];

	eventManager.getUserPlayback(self.networkId, self.user._id)
		.then(function (events) {
			var lastDate = {},
				timezoneOffset = parseInt(self.user.timezoneOffset, 10) || new Date().getTimezoneOffset(),
				now = moment().zone(timezoneOffset);

			events.forEach(function (event) {
				var message = new parseMessage(event.message.raw),
					timestamp = moment(event.message.time).zone(timezoneOffset),
					target = message.params[0],
					daysAgo,
					daysAgoString,
					timestampStr,
					isChannel = helper.isChannelString(target),
					sender = isChannel ? '***!ircanywhere@ircanywhere.com' : message.prefix,
					key = isChannel ? target : event.message.nickname;

				if (!channelsSent[key]) {
					self.sendRaw(':' + sender + ' PRIVMSG ' + target + ' :Playback Start...');
					channelsSent[key] = {
						sender: sender,
						target: target
					};
				}

				timestampStr = timestamp.format('h:mma');
				// Get the formatted string before startOf() changes the timestamp.

				if ((!lastDate[target] && timestamp.isBefore(now, 'day')) ||
					(lastDate[target] && timestamp.isAfter(lastDate[target], 'day'))) {

					lastDate[target] = timestamp;
					daysAgo = now.startOf('day').diff(timestamp.startOf('day'), 'days');

					if (daysAgo === 0) {
						daysAgoString = 'today';
					} else if (daysAgo === 1) {
						daysAgoString = 'yesterday';
					} else {
						daysAgoString = daysAgo + ' days ago';
					}

					self.sendRaw(':' + sender + ' PRIVMSG ' + target + ' :' + daysAgoString);
				}
				// Display message with date when playback messages changes dates.

				var origMessage = message.params[1];

				if (event.type === 'action' && origMessage.indexOf('ACTION') !== -1) {
					var index = origMessage.indexOf('ACTION') + 7;

					origMessage = origMessage.slice(0, index) + '[' + timestampStr + '] ' +
						origMessage.slice(index);
					// Add timestamp after ACTION
				} else {
					origMessage = '[' + timestampStr + '] ' + origMessage;
					// Prepend timestamp
				}

				if (!isChannel) {
					message.params[0] = network.nick;
				}

				message.params[1] = origMessage;

				self.sendRaw(message.toString());
			});

			return Q.resolve();
		})
		.then(function () {
			_.each(channelsSent, function (channel) {
				self.sendRaw(':' + channel.sender + ' PRIVMSG ' + channel.target + ' :Playback End.');
			});

			userManager.updateLastSeen(self.user._id);
		})
		.fail(function (error) {
			application.logger.log('warn', 'Ignoring playback error.');
			application.handleError(error, false);
			return Q.resolve();
		});
};

/**
 * Handles PRIVMSG messages from client. Forwards to ircHandler and to ircFactory.
 *
 * @method privmsg
 * @param {Object} message Received message
 * @return void
 */
ServerSession.prototype.privmsg = function(message) {
	if (!this.networkId) {
		return;
	}
	// Not ready to take requests yet.

	var hostmask = message.parseHostmaskFromPrefix(),
		timestamp = new Date(),
		hostname = (hostmask && hostmask.hostname) || 'none',
		network = Clients[this.networkId.toString()],
		data = {
			nickname: network.nick,
			username: this.user.ident,
			hostname: hostname,
			target: message.params[0],
			message: message.params[1],
			time: timestamp.toJSON(),
			raw: message.toString(),
			clientId: this.id
		};

	ircHandler.privmsg(Clients[this.networkId.toString()], data);
	// inset in the db

	ircFactory.send(this.networkId.toString(), 'raw', message.toString());
	// send to network

	userManager.updateLastSeen(this.user._id, timestamp);
};

/**
 * Handles all message that do not have a specific handler.
 *
 * @method onClientMessage
 * @param {Object} message Received message
 * @param {String} command Messages command
 * @return void
 */
ServerSession.prototype.onClientMessage = function(message, command) {
	if (!this.networkId) {
		return;
	}
	// Not ready to take requests yet.

	var network = Clients[this.networkId.toString()];

	if (ircHandler[command]) {
		var hostmask = message.parseHostmaskFromPrefix(),
			hostname = (hostmask && hostmask.hostname) || 'none',
			data = {
				nickname: network.nick,
				username: this.user.ident,
				hostname: hostname,
				target: '*', // TODO: Does this work for all messages?
				message: message.params[1],
				time: new Date().toJSON(),
				raw: message.toString(),
				clientId: this.id
			};

		ircHandler[command](Clients[this.networkId.toString()], data);
	}
	// Check if ircHandler can handle the command

	ircFactory.send(this.networkId.toString(), 'raw', message.toString());
	// send to network
};

/**
 * Sends a raw message to the client
 *
 * @method sendRaw
 * @param {String} rawMessage Raw message
 * @return void
 */
ServerSession.prototype.sendRaw = function(rawMessage) {
	if (_.isArray(rawMessage)) {
		rawMessage = rawMessage.join('\r\n');
	}

	if (ServerSession.debug) {
		console.log(new Date().toJSON(), 'to client -', rawMessage);
	}

	this.socket.write(rawMessage + '\r\n');
};

ServerSession.prototype = _.extend(ServerSession.prototype, hooks);

exports.ServerSession = ServerSession;
