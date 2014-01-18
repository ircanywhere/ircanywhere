App = Ember.Application.create({
	Socket: Ember.Socket.extend({
		controllers: ['index', 'tab', 'sidebar']
    })
});

App.Router.reopen({
	location: 'history'
});