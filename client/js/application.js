App = Ember.Application.create({
	Socket: Ember.Socket.extend({
		controllers: ['tab', 'sidebar']
    })
});

App.Router.reopen({
	location: 'history'
});