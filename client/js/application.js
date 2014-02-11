App = Ember.Application.create({
	LOG_TRANSITIONS: false,
	
	defaultTitle: 'IRCAnywhere',
	timeout: null,
	timein: null,
	visibility: true,
	
	Parser: Ember.Parser.create(),

	Socket: Ember.Socket.extend({
		controllers: ['addnetwork', 'input', 'messages', 'network', 'settings', 'sidebar', 'titlebar', 'userlist']
	})
});