IRCFactory = (function() {
	"use strict";

	var Factory = {

		init: function() {

			this.process = Meteor.require('irc-factory').process;
			// first we fork 

			// this is what we do to initialise the irc factory
			// this will basically be the client end of ircanywhere/irc-factory package
			// docs on how that work are in the README file
		}
	};

	return Factory;
}());
// create our factory object

Meteor.ircFactory = Object.create(IRCFactory);
Meteor.ircFactory.init();
// assign it to Meteor namespace so its accessible and rememberable