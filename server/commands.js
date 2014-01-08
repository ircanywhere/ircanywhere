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
			this.createAlias('/quit', '/disconnect');
			this.createAlias('/connect', '/reconnect');
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
			if (params.length !== 0 && Meteor.Helpers.isChannel(client.internal.capabilities.channel.types, params[0])) {
				ircFactory.send(client._id, 'join', params);
			} else {
				ircFactory.send(client._id, 'join', [target].concat(params));
			}
		},

		'/part': function(user, client, target, params) {
			if (params.length !== 0 && Meteor.Helpers.isChannel(client.internal.capabilities.channel.types, params[0])) {
				ircFactory.send(client._id, 'part', params);
			} else {
				ircFactory.send(client._id, 'part', [target].concat(params));
			}
		},

		'/topic': function(user, client, target, params) {
			if (Meteor.Helpers.isChannel(client.internal.capabilities.channel.types, params[0])) {
				ircFactory.send(client._id, 'topic', params);
			} else {
				ircFactory.send(client._id, 'topic', [target].concat(params));
			}
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

		'/close': function(user, client, target, params) {
			var tab = Tabs.findOne({target: target, network: client._id});
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
			}
		},

		'/quit': function(user, client, target, params) {
			ircFactory.send(client._id, 'disconnect', [params]);
			// it's important we don't destroy the network here, because
			// doing a .connect to try and reconnect wont work, if the user closes the network
			// tab then we can call destroy then remove the tab and network record
		},

		'/connect': function(user, client, target, params) {
			ircFactory.send(client._id, 'reconnect', []);
		},

		raw: function(user, client, target, params) {
			console.log(arguments);
		}
	};

	Manager.init();

	return _.extend(Manager, hooks);
};