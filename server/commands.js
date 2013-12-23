CommandManager = function() {
	"use strict";

	var _ = Meteor.require('underscore'),
		hooks = Meteor.require('hooks');

	var Manager = {
		init: function() {
			var self = this;

			Commands.allow({
				insert: function(userId, doc) {
					//return (userId && doc.user === userId && doc.command && doc.tab);
					return (doc.command && doc.network && doc.target);
				}
			});
			// setup allow rules for this collection

			Commands.find({}).observe({
				added: function(doc) {
					var user = Meteor.users.find({_id: doc.user}),
						client = ircFactory.clients[doc.network];

					self.parseCommand(user, client, doc.target.toLowerCase(), doc.command);
				}
			});
			// loop for inserts to this collection
		},

		parseCommand: function(user, client, target, command) {
			if (command.charAt(0) === '/' && command.charAt(1) !== '/') {
				console.log(command);
				// is this a command? if it's prefixed with one / then yes
			} else {
				ircFactory.send(client.key, 'privmsg', [target, command]);
				// nope this is a message, lets just send it straight out because if the target
				// is empty then it won't have been accepted into the collection

				ircFactory.send(client.key, '_parseLine', [':' + client.nickname + '!' + client.user + '@' + client.hostname + ' PRIVMSG ' + target + ' :' + command])
				// bit of hackery here but we also send it to _parseLine so it comes right
				// back through and looks like it's came from someone else.
			}
		}
	};

	Manager.init();

	return _.extend(Manager, hooks);
};