App = Ember.Application.create({
	LOG_TRANSITIONS: true,
	
	defaultTitle: 'IRCAnywhere',
	timeout: null,
	timein: null,
	
	Parser: Ember.Parser.create(),

	Socket: Ember.Socket.extend({
		controllers: ['application', 'index', 'login', 'settings', 'addnetwork', 'titlebar', 'network', 'messages', 'input', 'userlist', 'sidebar', 'sidebaritem']
    })
});