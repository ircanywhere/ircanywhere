App = Ember.Application.create({
	defaultTitle: 'IRCAnywhere',
	
	Parser: Ember.Parser.create(),

	Socket: Ember.Socket.extend({
		controllers: ['index', 'login', 'titlebar', 'network', 'messages', 'sidebar']
    })
});

App.Router.reopen({
	location: 'history'
});