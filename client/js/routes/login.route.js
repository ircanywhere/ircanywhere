App.Router.map(function() {
	this.route('login', {path: '/login'});
});

App.LoginRoute = AppRoute.extend({
	activate: function() {
		this.updateTitle();
	}
});