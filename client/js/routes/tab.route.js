App.Router.map(function() {
	this.resource('tab', {path: '/t/:url'}, function() {
		this.resource('channel', {path: '/:title'});
	});
});

App.TabRoute = AppRoute.extend({
	model: function(params) {
		return this.controllerFor('tab').socket.findButWait('networks', {url: params.url});
	},

	title: function(controller, model) {
		return 'wat';
	}
});