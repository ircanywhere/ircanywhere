App.Router.map(function() {
	this.route('signup', {path: '/signup'});
});

App.SignupRoute = AppRoute.extend({
	title: function(controller, model) {
		return controller.get('title');
	}
});