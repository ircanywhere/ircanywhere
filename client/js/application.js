/*global App:true */
App = Ember.Application.create({
	LOG_TRANSITIONS: false,
	// ember settings
	
	defaultTitle: 'IRCAnywhere',
	title: 'IRCAnywhere',
	timeout: null,
	timein: null,
	size: '',
	// global variables

	controllers: []
	// controllers - now empty, we let controllers inject themselves
});

App.reopen({
	Parser: Ember.Parser.create(),
	Socket: Ember.Socket.extend({
		controllers: App.get('controllers')
	}),
	// application objects

	injectController: function(controller) {
		var controllers = this.get('controllers');

		if (controllers.indexOf(controller) === -1) {
			controllers.push(controller);
		}
	}
});