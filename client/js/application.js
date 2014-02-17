App = Ember.Application.create({
	LOG_TRANSITIONS: true,
	// ember settings
	
	defaultTitle: 'IRCAnywhere',
	timeout: null,
	timein: null,
	visibility: true,
	// global variables
	
	Parser: Ember.Parser.create(),
	Socket: Ember.Socket.extend({
		controllers: ['index', 'addnetwork', 'input', 'messages', 'network', 'settings', 'sidebar', 'titlebar', 'userlist']
	})
	// application objects
});