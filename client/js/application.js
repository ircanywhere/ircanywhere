App = Ember.Application.create({
	defaultTitle: 'IRCAnywhere',
	
	Socket: Ember.Socket.extend({
		controllers: ['index', 'login', 'tab', 'sidebar']
    })
});

App.Router.reopen({
	location: 'history'
});