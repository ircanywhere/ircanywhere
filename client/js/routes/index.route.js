App.IndexRoute = AppRoute.extend({
	title: function(controller, model) {
		return controller.get('title');
	}
});