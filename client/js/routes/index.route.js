App.IndexRoute = AppRoute.extend({
	activate: function() {
		this.controllerFor('index').onTransition();
	},

	title: function(controller, model) {
		return controller.get('title');
	}
});