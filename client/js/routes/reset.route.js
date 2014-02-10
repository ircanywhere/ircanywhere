App.Router.map(function() {
	this.route('reset', {path: '/reset/:token'});
});

App.ResetRoute = AppRoute.extend({
	title: function(controller, model) {
		return controller.get('title');
	}
});