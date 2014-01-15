App.IndexRoute = AppRoute.extend({
	actions: {
		changeTemplate: function(selection, into) {
			this.render(selection, {
				outlet: 'main',
				into: into
			});
		}
	},

	title: function(controller, model) {
		return controller.get('title');
	}
});