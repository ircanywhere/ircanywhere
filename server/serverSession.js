/**
 * IRCAnywhere server/serverSession.js
 *
 * @title ServerSession
 * @copyright (c) 2013-2014 http://ircanywhere.com
 * @license GPL v2
 * @author Rodrigo Silveira
 */

var IrcMessage = require('irc-message'),
	_ = require('lodash'),
	moment = require('moment'),
	Q = require('q');

/**
 * Handles the communication between an IRC client and ircanywhere's IRC server. Instantiated on
 * every new client connection.
 *
 * @param {Object} socket Connection socket to the client
 * @constructor ServerSession
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
 * Initializes session.
 *
 * @return void
 */
ServerSession.prototype.init = function() {
	var self = this;

	this.socket.on('data', function(data) {
		var lines = data.toString().split("\r\n");
		// One command por line

		lines.pop();
		// last line will be blank, ignore

		lines.forEach(function(line) {
			var message = IrcMessage(line),
				command = message.command.toLowerCase();

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
 * @param {Object} message Received message
 */
ServerSession.prototype.pass = function(message) {
	this.password = message.params[0];
	// PASS message should be the first, before USER or NICK.
};

/**
 * Handles NICK message from client. If message arrives before welcome, just store nickname temporarily to use
 * on the welcome message. Otherwise forward it.
 *
 * @param {Object} message Received message
 */
ServerSession.prototype.nick = function(message) {
	if (!this.welcomed) {
		this.clientNick = message.params[0];
		// first nick, just store it locally for the welcome msg.
	} else {
		this.onClientMessage(message, 'nick')
	}
};

/**
 * Handles QUIT message from client. Disconnects the user.
 */
ServerSession.prototype.quit = function() {
	this.sendRaw("ERROR :Quitting");
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
 * @param {Object} message Received message
 */
ServerSession.prototype.user = function(message) {
	var self = this,
		params = message.params[0].split('/'),
		email = params[0],
		network = params[1];

	if (!self.password) {
		application.logger.log('warn', 'Unable to log in user', email, 'password not specified.');
		self.disconnectUser();
		return;
	}

	userManager.loginServerUser(email, self.password)
		.fail(function(error){
			// TODO send a 464 ERR_PASSWDMISMATCH

			application.logger.log('error', 'error logging in user ' + email);
			application.handleError(error, false);
			self.disconnectUser();

			return Q.reject(error);
		})
		.then(function(user) {
			self.user = user;
			self.email = email;

			return networkManager.getClientsForUser(user._id);
		})
		.then(function(networks) {
			if (networks.length === 1) {
				self.network = networks[0];
				// if only one network, choose it
			} else {
				self.network = _.find(networks, {name: network});
				if (!self.network) {
					return Q.reject(new Error('Network ' + network + ' not found.'));
				}
			}

			self.setup();
			return self.sendWelcome()
				.fail(function(error){
					application.handleError(error, false);
					self.disconnectUser();

					return Q.reject(error);
				});
		})
		.then(function () {
			return self.sendJoins();
		})
		.then(function () {
			self.sendPlayback();
		});
};

/**
 * Sets up client to listen to IRC activity.
 *
 * @return void
 */
ServerSession.prototype.setup = function() {
	var eventsCallback = this.handleEvent.bind(this),
		ircMessageCallback = this.handleIrcMessage.bind(this);

	application.ee.on(['events', 'insert'], eventsCallback);
	ircFactory.events.on('message', ircMessageCallback);

	this.socket.on('close', function() {
		application.ee.removeListener(['events', 'insert'], eventsCallback);
		ircFactory.events.removeListener('message', ircMessageCallback);
	}.bind(this));
};

/**
 * Handle IRC events.
 *
 * @param {Object} event Event to handle
 */
ServerSession.prototype.handleEvent =  function(event) {
	var ignore = ['registered', 'lusers', 'motd'];

	if (event.message.clientId === this.id) {
		return;
	}
	// Don't duplicate events.

	if (event.network !== this.network.name) {
		return;
	}
	// Check network

	if (_.contains(ignore, event.type)) {
		return;
	}
	// Is in the ignore list

	if (event.type === 'privmsg') {
		userManager.updateLastSeen(this.user._id);
	}

	this.sendRaw(event.message.raw);
	// Sent to client
};

/**
 * Forwards messages that are not stored in the events collection in the database.
 *
 * @param ircMessage
 */
ServerSession.prototype.handleIrcMessage = function (ircMessage) {
	var fwdMessages = ['names', 'who', 'topic'],
		clientKey = ircMessage.event[0].toString(),
		command = ircMessage.event[1],
		message = ircMessage.message;

	if (this.network._id.toString() !== clientKey) {
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
 * @return {promise}
 */
ServerSession.prototype.sendWelcome = function () {
	var self = this;

	function sendWelcomeMessagesForClientNick(rawMessages) {
		function setNick(rawMessage) {
			var message = new IrcMessage(rawMessage);

			message.params[0] = self.clientNick;

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

	return eventManager.getEventByType('registered', self.network.name, self.user._id)
		.then(function (event) {
			if (event) {
				sendWelcomeMessagesForClientNick(event.message.raw);
			}

			return eventManager.getEventByType('lusers', self.network.name, self.user._id);
		})
		.then(function (event) {
			if (event) {
				sendWelcomeMessagesForClientNick(event.message.raw);
			}

			if (self.clientNick !== self.network.nick) {
				self.sendRaw(':' + self.clientNick + ' NICK :' + self.network.nick);
			}
			// Change nick on client to what we have on the network.

			return eventManager.getEventByType('motd', self.network.name, self.user._id);
		})
		.then(function (event) {
			if (event) {
				self.sendRaw(event.message.raw);
			}

			return eventManager.getEventByType('usermode', self.network.name, self.user._id);
		})
		.then(function (event) {
			if (event) {
				self.sendRaw(event.message.raw);
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
 * @return {promise}
 */
ServerSession.prototype.sendJoins = function () {
	var self = this;

	return networkManager.getActiveChannelsForUser(self.user._id, self.network._id)
		.then(function (tabs) {
			return Q.all(tabs.map(function (tab) {
				var deferred = Q.defer();

				application.Events.find({type: 'join', 'message.self': true, network: self.network.name, user: self.user._id, target: tab.target}).sort({"message.time": -1}).limit(1).nextObject(function(err, event) {
					if (err || !event) {
						deferred.reject(err);
						return;
					}

					self.sendRaw(event.message.raw);

					ircFactory.send(self.network._id.toString(), 'raw', ['NAMES ' + tab.target]);
					// TODO: names command is throttled, may need to generate one from channelUsers.

					deferred.resolve();
				});

				return deferred.promise;
			}));
		});
};

/**
 * Sends playback messages to client.
 *
 * @return void
 */
ServerSession.prototype.sendPlayback = function () {
	var self = this,
		channelsSent = {};

	eventManager.getUserPlayback(self.network.name, self.user._id, self.user.lastSeen.toJSON())
		.then(function (events) {
			var lastDate = {},
				now = moment().zone(self.user.timezoneOffset || new Date().getTimezoneOffset());

			events.forEach(function (event) {
				var message = new IrcMessage(event.message.raw),
					timestamp = moment(event.message.time),
					channel = message.params[0],
					daysAgo,
					daysAgoString;

				if (!channelsSent[channel]) {
					self.sendRaw(':***!ircanywhere@ircanywhere.com PRIVMSG ' + channel + ' :Playback Start...');
					channelsSent[channel] = true;
				}

				if (self.user.timezoneOffset) {
					timestamp.zone(self.user.timezoneOffset);
				}
				// Correct timezone if information available.

				if ((!lastDate[channel] && timestamp.isBefore(now, 'day')) || timestamp.isAfter(lastDate[channel], 'day')) {
					lastDate[channel] = timestamp;
					daysAgo = now.startOf('day').diff(timestamp.startOf('day'), 'days');

					if (daysAgo === 0) {
						daysAgoString = 'today';
					} else if (daysAgo === 1) {
						daysAgoString = 'yesterday';
					} else {
						daysAgoString = daysAgo + ' days ago';
					}

					self.sendRaw(':***!ircanywhere@ircanywhere.com PRIVMSG ' + channel + ' :' + daysAgoString);
				}
				// Display message with date when playback messages changes dates.

				message.params[1] = '[' + timestamp.format('h:ma') + '] ' +
					message.params[1];
				// Prepend timestamp

				self.sendRaw(message.toString());
			});

			return Q.resolve();
		})
		.then(function () {
			_.each(_.keys(channelsSent), function (channel) {
				self.sendRaw(':***!ircanywhere@ircanywhere.com PRIVMSG ' + channel + ' :Playback End.');
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
 * @param {Object} message Received message
 */
ServerSession.prototype.privmsg = function(message) {
	var hostmask = message.parseHostmaskFromPrefix(),
		timestamp = new Date(),
		hostname = (hostmask && hostmask.hostname) || 'none',
		data = {
			nickname: this.network.nick,
			username: this.user.ident,
			hostname: hostname,
			target: message.params[0],
			message: message.params[1],
			time: timestamp.toJSON(),
			raw: message.toString(),
			clientId: this.id
		};

	ircHandler.privmsg(Clients[this.network._id.toString()], data);
	// inset in the db

	ircFactory.send(this.network._id.toString(), 'raw', [message.toString()]);
	// send to network

	userManager.updateLastSeen(this.user._id, timestamp);
};

/**
 * Handles all message that do not have a specific handler.
 *
 * @param {Object} message Received message
 * @param {String} command Messages command
 */
ServerSession.prototype.onClientMessage = function(message, command) {
	if (!this.network) {
		return;
	}
	// Not ready to take requests yet.

	if (ircHandler[command]) {
		var hostmask = message.parseHostmaskFromPrefix(),
			hostname = (hostmask && hostmask.hostname) || 'none',
			data = {
				nickname: this.network.nick,
				username: this.user.ident,
				hostname: hostname,
				target: '*', // TODO: Does this work for all messages?
				message: message.params[1],
				time: new Date().toJSON(),
				raw: message.toString(),
				clientId: this.id
			};

		ircHandler[command](Clients[this.network._id.toString()], data);
	}
	// Check if ircHandler can handle the command

	ircFactory.send(this.network._id.toString(), 'raw', [message.toString()]);
	// send to network

	// TODO: Should update lastseen on some messages.
};

/**
 * Sends a raw message to the client
 *
 * @param {String} rawMessage
 */
ServerSession.prototype.sendRaw = function(rawMessage) {
	if (_.isArray(rawMessage)) {
		rawMessage = rawMessage.join("\r\n");
	}

	this.socket.write(rawMessage + "\r\n");
};

exports.ServerSession = ServerSession;