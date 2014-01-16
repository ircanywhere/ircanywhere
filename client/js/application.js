App = Ember.Application.create({
	DataStore: DS.SocketAdapter.create()
});

App.Router.reopen({
	location: 'history'
});