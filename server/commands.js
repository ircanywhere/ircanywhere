CommandManager = function() {
	"use strict";

	var _ = require('lodash'),
		hooks = require('hooks'),
		mongo = require('mongodb'),
		_ban = function(client, target, nickname, ban) {
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
		};

	var Manager = {
		init: function() {
			application.ee.on(['commands', 'insert'], function(doc) {
				fibrous.run(function() {
					var user = application.Users.sync.findOne({_id: doc.user}),
						client = Clients[doc.network.toString()];
					// get some variables

					Manager.parseCommand(user, client, doc.target.toLowerCase(), doc.command);
					// success
				});
			});

			Manager.createAlias('/join', '/j');
			Manager.createAlias('/part', '/p', '/leave');
			Manager.createAlias('/cycle', '/hop');
			Manager.createAlias('/quit', '/disconnect');
			Manager.createAlias('/query', '/q');
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
					this['/raw'](user, client, target, params);
				}
				// is this a command? if it's prefixed with one / then yes
			} else {
				command = (command.charAt(1) === '/') ? command.substr(1) : command;
				// strip one of the /'s off if it has two at the start

				this['/msg'](user, client, target, command.split(' '));
				// just split it to follow standards with other commands, it'll be rejoined before sent out
			}
		},


		'/msg': function(user, client, target, params) {
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
		},

		'/notice': function(user, client, target, params) {
			if (params.length == 0) {
				return false;
			}

			ircFactory.send(client._id, 'notice', [target, params.join(' ')]);
			ircFactory.send(client._id, '_parseLine', [':' + client.nick + '!' + client.user + '@' + client.hostname + ' NOTICE ' + target + ' :' + params.join(' ')]);
			// same as above, we don't get a reciept for notices so we push it back through our buffer
		},

		'/me': function(user, client, target, params) {
			if (params.length == 0) {
				return false;
			}

			ircFactory.send(client._id, 'me', [target, params.join(' ')]);
			ircFactory.send(client._id, '_parseLine', [':' + client.nick + '!' + client.user + '@' + client.hostname + ' PRIVMSG ' + target + ' :ACTION ' + params.join(' ') + '']);
			// same as above, we don't get a reciept for /me so we push it back through our buffer
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

		'/cycle': function(user, client, target, params) {
			if (Meteor.Helpers.isChannel(client.internal.capabilities.channel.types, params[0])) {
				ircFactory.send(client._id, 'part', params);
				ircFactory.send(client._id, 'join', params);
			} else {
				ircFactory.send(client._id, 'part', [target].concat(params));
				ircFactory.send(client._id, 'join', [target].concat(params));
			}
		},

		'/topic': function(user, client, target, params) {
			if (params.length == 0) {
				return false;
			}

			if (Meteor.Helpers.isChannel(client.internal.capabilities.channel.types, params[0])) {
				var topic = [params.slice(1).join(' ')];
				ircFactory.send(client._id, 'topic', [params[0]].concat(topic));
			} else {
				var topic = [params.join(' ')];
				ircFactory.send(client._id, 'topic', [target].concat(topic));
			}
			// we need to do some altering on the topic becasue it has multiple spaces
		},

		'/mode': function(user, client, target, params) {
			if (Meteor.Helpers.isChannel(client.internal.capabilities.channel.types, params[0])) {
				console.log('target exists', params);
				ircFactory.send(client._id, 'mode', params);
			} else {
				console.log('no target', [target].concat(params));
				ircFactory.send(client._id, 'mode', [target].concat(params));
			}
		},

		'/invite': function(user, client, target, params) {
			if (params.length !== 0 && Meteor.Helpers.isChannel(client.internal.capabilities.channel.types, params[0])) {
				ircFactory.send(client._id, 'raw', ['INVITE'].concat(params));
			} else {
				ircFactory.send(client._id, 'raw', ['INVITE', params[0], target]);
			}
		},

		'/kick': function(user, client, target, params) {
			if (params.length !== 0 && Meteor.Helpers.isChannel(client.internal.capabilities.channel.types, params[0])) {
				ircFactory.send(client._id, 'raw', ['KICK'].concat(params));
			} else {
				ircFactory.send(client._id, 'raw', ['KICK', target].concat(params));
			}
		},

		'/kickban': function(user, client, target, params) {
			this['/ban'](user, client, target, params);
			this['/kick'](user, client, target, params);
			// just straight up alias the commands
		},

		'/ban': function(user, client, target, params) {
			_ban(client, target, nickname, ban, '+b');
			// +b
		},

		'/unban': function(user, client, target, params) {
			_ban(client, target, nickname, ban, '-b');
			// -b
		},

		'/nick': function(user, client, target, params) {
			if (params.length > 0) {
				ircFactory.send(client._id, 'raw', ['NICK'].concat(params));
			}
		},

		'/away': function(user, client, target, params) {
			var message = (params.length === 0) ? 'Away from client' : params.join(' ');
			ircFactory.send(client._id, 'raw', ['AWAY', message]);
		},

		'/unaway': function(user, client, target, params) {
			ircFactory.send(client._id, 'raw', ['AWAY']);
		},

		'/close': function(user, client, target, params) {
			var tab = Tabs.sync.findOne({target: target, network: client._id});
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
		},

		'/query': function(user, client, target, params) {
			networkManager.addTab(client, target, 'query', true);
		},

		'/quit': function(user, client, target, params) {
			ircFactory.send(client._id, 'disconnect', [params]);
			// it's important we don't destroy the network here, because
			// doing a .connect to try and reconnect wont work, if the user closes the network
			// tab then we can call destroy then remove the tab and network record
		},

		'/reconnect': function(user, client, target, params) {
			ircFactory.send(client._id, 'reconnect', []);
			// send the go ahead

			networkManager.activeTab(client, client.name, true);
			networkManager.changeStatus(client._id, networkManager.flags.connecting);
			// mark as connecting and mark the tab as active again
		},

		'/raw': function(user, client, target, params) {
			if (params.length > 0) {
				ircFactory.send(client._id, 'raw', params);
			}
		}
	};

	application.ee.on('ready', function() {
		fibrous.run(Manager.init);
	});

	return _.extend(Manager, hooks);
};

exports.CommandManager = CommandManager;