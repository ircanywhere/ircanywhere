App = Ember.Application.create({
	Socket: Ember.Socket.extend({
		controllers: ['index', 'tab']
    })
});

App.Router.reopen({
	location: 'history'
});