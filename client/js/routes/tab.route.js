App.Router.map(function() {
	this.route('tab', {path: '/t/:url'});
});

App.TabRoute = AppRoute.extend({
	model: function() {
		return this.controllerFor('index').socket.connect();
	},

	actions: {
		error: function(reason) {
			this.transitionTo('login');
		},

		loading: function(transition, original) {
			return true;
		}
	},
	
	title: function(controller, model) {
		return controller.get('title');
	}
});