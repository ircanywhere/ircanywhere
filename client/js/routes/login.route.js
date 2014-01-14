App.Router.map(function() {
	this.route('login', {path: '/login'});
});

App.LoginRoute = AppRoute.extend({
	title: function(controller, model) {
		return controller.get('title');
	}
});