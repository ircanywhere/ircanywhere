CommandManager = function() {
	"use strict";

	var hooks = Meteor.require('hooks');

	var Manager = {
		init: function() {
			var self = this;

			Meteor.publish('commands', function() {
				return Commands.find({'user': this.userId});
			});

			Commands.allow({
				insert: function(userId, doc) {
					doc.timestamp = +new Date();
					// modify doc

					return ((userId && doc.user === userId) && 
							(doc.command && doc.network) &&
							(doc.target !== '') &&
							(doc.sent === false));
				}
			});
			// setup allow rules for this collection

			Commands.find({sent: false}).observe({
				added: function(doc) {
					var user = Meteor.users.find({_id: doc.user}),
						client = Clients[doc.network];

					self.parseCommand(user, client, doc.target.toLowerCase(), doc.command);
					Commands.update({_id: doc._id}, {$set: {sent: true}});
				}
			});
			// loop for inserts to this collection

			this.createAlias('/join', '/j');
			this.createAlias('/part', '/p', '/leave');
			// setup aliases
		},

		createAlias: function() {
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
		},

		parseCommand: function(user, client, target, command) {
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
					this.raw(user, client, target, params);
				}
				// is this a command? if it's prefixed with one / then yes
			} else {
				command = (command.charAt(1) === '/') ? command.substr(1) : command;
				// strip one of the /'s off if it has two at the start

				this['/msg'](user, client, target, command.split(' '));
				// just split it to follow standards with other commands, it'll be rejoined before sent out
			}
		},

		'/join': function(user, client, target, params) {
			ircFactory.send(client._id, 'join', params);
		},

		'/part': function(user, client, target, params) {
			ircFactory.send(client._id, 'part', params);
		},

		'/msg': function(user, client, target, params) {
			ircFactory.send(client._id, 'privmsg', [target, params.join(' ')]);
			ircFactory.send(client._id, '_parseLine', [':' + client.nick + '!' + client.user + '@' + client.hostname + ' PRIVMSG ' + target + ' :' + params.join(' ')]);
			// nope this is a message, lets just send it straight out because if the target
			// is empty then it won't have been accepted into the collection
			// bit of hackery here but we also send it to _parseLine so it comes right
			// back through and looks like it's came from someone else - it's actually 99.9% more cleaner than the
			// last buggy implementation so I'm very happy with this, don't fuck about it with it.
		},

		'/notice': function(user, client, target, params) {
			ircFactory.send(client._id, 'notice', [target, params.join(' ')]);
			ircFactory.send(client._id, '_parseLine', [':' + client.nick + '!' + client.user + '@' + client.hostname + ' NOTICE ' + target + ' :' + params.join(' ')]);
			// same as above, we don't get a reciept for notices so we push it back through our buffer
		},

		'/me': function(user, client, target, params) {
			ircFactory.send(client._id, 'me', [target, params.join(' ')]);
			ircFactory.send(client._id, '_parseLine', [':' + client.nick + '!' + client.user + '@' + client.hostname + ' PRIVMSG ' + target + ' :ACTION ' + params.join(' ') + '']);
			// same as above, we don't get a reciept for /me so we push it back through our buffer
		},

		raw: function(user, client, target, params) {
			console.log(arguments);
		}
	};

	Manager.init();

	return _.extend(Manager, hooks);
};