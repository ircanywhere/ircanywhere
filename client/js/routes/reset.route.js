App.Router.map(function() {
	this.route('reset', {path: '/reset/:token'});
});

App.ResetRoute = AppRoute.extend({
	title: 'Reset Password - IRCAnywhere',

	activate: function() {
		this.updateTitle(this.title);
	}
});