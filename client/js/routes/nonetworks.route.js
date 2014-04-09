App.Router.map(function() {
	this.route('nonetworks', {path: '/nonetworks'});
});

App.NonetworksRoute = AppRoute.extend({
	title: function(controller, model) {
		return controller.get('title');
	},

	activate: function() {
		this.controllerFor('index').determinePath();
	}
});