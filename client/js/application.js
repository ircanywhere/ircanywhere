App = Ember.Application.create({
	Socket: Ember.Socket.extend({
		controllers: ['index']
    })
});

App.Router.reopen({
	location: 'history'
});