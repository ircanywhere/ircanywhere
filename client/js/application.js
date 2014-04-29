App = Ember.Application.create({
	LOG_TRANSITIONS: true,
	// ember settings
	
	defaultTitle: 'IRCAnywhere',
	title: 'IRCAnywhere',
	timeout: null,
	timein: null,
	isActive: true,
	size: '',
	// global variables
	
	Parser: Ember.Parser.create(),
	Socket: Ember.Socket.extend({
		controllers: ['index', 'login', 'disconnected', 'addnetwork', 'input', 'messages', 'network', 'settings', 'sidebar', 'titlebar', 'userlist', 'infolist', 'list']
	})
	// application objects
});