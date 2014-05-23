App.Router.map(function() {
	this.route('nonetworks', {path: '/nonetworks'});
});

App.NonetworksRoute = AppRoute.extend({
	activate: function() {
		this.controllerFor('index').determinePath();
		this.updateTitle();
	}
});