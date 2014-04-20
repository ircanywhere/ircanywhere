App.Router.map(function() {
	this.route('signup', {path: '/signup'});
});

App.SignupRoute = AppRoute.extend({
	title: 'Signup - IRCAnywhere',
	
	activate: function() {
		this.updateTitle(this.title);
	}
});