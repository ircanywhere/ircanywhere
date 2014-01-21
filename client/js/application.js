App = Ember.Application.create({
	defaultTitle: 'IRCAnywhere',
	
	Socket: Ember.Socket.extend({
		controllers: ['index', 'login', 'tab', 'messages', 'sidebar']
    })
});

App.Router.reopen({
	location: 'history'
});