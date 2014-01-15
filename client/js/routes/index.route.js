App.IndexRoute = AppRoute.extend({
	activate: function() {
		this.controllerFor('index').attemptConnect();
	},

	title: function(controller, model) {
		return controller.get('title');
	}
});