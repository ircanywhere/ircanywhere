App.Router.map(function() {
	this.route('signup', {path: '/signup'});
});

App.SignupRoute = AppRoute.extend({
	setupController: function(controller, model) {
		controller.set('title', 'Signup - IRCAnywhere');
	},

	title: function(controller, model) {
		return controller.get('title');
	}
});