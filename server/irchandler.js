IRCHandler = (function() {
	"use strict";

	var Handler = {
		init: function() {
			
		}
	};

	return Handler;
}());
// create our application

Meteor.ircHandler = Object.create(IRCHandler);
Meteor.ircHandler.init();
// assign it to Meteor namespace so its accessible