App.IndexRoute = AppRoute.extend({
	activate: function() {
		this.controllerFor('index').attemptConnect();
	},

	actions: {
		changeTemplate: function(selection, into) {
			this.render(selection, {
				into: into,
				controller: selection
			});
		}
	},

	title: function(controller, model) {
		return controller.get('title');
	}
});