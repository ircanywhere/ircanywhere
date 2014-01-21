App = Ember.Application.create({
	defaultTitle: 'IRCAnywhere',
	
	Socket: Ember.Socket.extend({
		controllers: ['index', 'login', 'titlebar', 'tab', 'messages', 'sidebar']
    })
});

App.Router.reopen({
	location: 'history'
});