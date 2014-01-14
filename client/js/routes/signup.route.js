App.Router.map(function() {
	this.route('signup', {path: '/signup'});
});

App.SignupRoute = AppRoute.extend({
	setupController: function(controller, model) {
		controller.set('title', 'IRCAnywhere - Signup');
	},

	title: function(controller, model) {
		return controller.get('title');
	}
});