App.Router.map(function() {
	this.route('index', {path: '/'});
});

App.IndexRoute = AppRoute.extend({
	title: function(controller, model) {
		return controller.get('title');
	}
});