App.Router.map(function() {
	this.route('main', {path: '/t/:url'});
});

App.MainRoute = AppRoute.extend({
	model: function() {
		return this.controllerFor('index').socket.connect();
	},
	
	title: function(controller, model) {
		return controller.get('title');
	}
});