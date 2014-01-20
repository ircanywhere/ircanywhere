App = Ember.Application.create({
	Socket: Ember.Socket.extend({
		controllers: ['index', 'tab', 'channel', 'sidebar']
    })
});

App.Router.reopen({
	location: 'history'
});