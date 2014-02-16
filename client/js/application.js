App = Ember.Application.create({
	LOG_TRANSITIONS: true,
	
	defaultTitle: 'IRCAnywhere',
	timeout: null,
	timein: null,
	visibility: true,
	
	Parser: Ember.Parser.create(),

	Socket: Ember.Socket.extend({
		controllers: ['index', 'addnetwork', 'input', 'messages', 'network', 'settings', 'sidebar', 'titlebar', 'userlist']
	})
});