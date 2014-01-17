App = Ember.Application.create({
	Socket: Ember.Socket.extend({
		controllers: ['application']
    })
});

App.Router.reopen({
	location: 'history'
});