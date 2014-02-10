App.IndexRoute = AppRoute.extend({
	title: function(controller, model) {
		return controller.get('title');
	},

	activate: function() {
		this.controllerFor('index').determinePath();
	}
});