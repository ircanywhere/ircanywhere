App = Ember.Application.create({
	defaultTitle: 'IRCAnywhere',
	timeout: null,
	timein: null,
	
	Parser: Ember.Parser.create(),

	Socket: Ember.Socket.extend({
		controllers: ['index', 'login', 'titlebar', 'network', 'messages', 'input', 'userlist', 'sidebar', 'sidebaritem']
    })
});

App.Router.reopen({
	location: 'history'
});