IRCHandler = (function() {
	"use strict";

	var Handler = {
		init: function() {
			
		},

		handle: function(client, e, args) {
			console.log(e, args);
		}
	};

	return Handler;
}());
// create our application

Meteor.ircHandler = Object.create(IRCHandler);
Meteor.ircHandler.init();
// assign it to Meteor namespace so its accessible