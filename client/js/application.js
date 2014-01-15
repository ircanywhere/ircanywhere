App = Ember.Application.create({
	Socket: Ember.Socket.extend({
		controllers: ['index']
	})
	// create a socket in the App namespace based on our Ember.Socket module
});

App.Router.reopen({
	location: 'history'
});