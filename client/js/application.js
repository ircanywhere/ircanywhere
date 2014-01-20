App = Ember.Application.create({
	Socket: Ember.Socket.extend({
		controllers: ['index', 'login', 'tab', 'channel', 'sidebar']
    })
});

App.Router.reopen({
	location: 'history'
});