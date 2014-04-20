App.Router.map(function() {
	this.route('nonetworks', {path: '/nonetworks'});
});

App.NonetworksRoute = Ember.Route.extend({
	activate: function() {
		this.controllerFor('index').determinePath();
		this.updateTitle();
	}
});