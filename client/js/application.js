App = Ember.Application.create({
	store: DS.Store.create({
		revision: 11,
		adapter: DS.SocketAdapter.create({})
	})
});

App.Router.reopen({
	location: 'history'
});