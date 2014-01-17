App.Router.map(function() {
	this.route('tab', {path: '/t/:url'});
});

App.TabRoute = AppRoute.extend({
	model: function() {
		return this.controllerFor('index').socket.connect();
	},
	
	title: function(controller, model) {
		return controller.get('title');
	}
});