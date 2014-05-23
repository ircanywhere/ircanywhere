App.Router.map(function() {
	this.route('login', {path: '/login'});
});

App.LoginRoute = AppRoute.extend({
	activate: function() {
		this.updateTitle();
	},

	actions: {
		willTransition: function () {
			this.controller.set('errors', false);
			this.controller.set('success', false);
		}
	}
});