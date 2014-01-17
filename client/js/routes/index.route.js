App.Router.map(function() {
	this.resource('/', function() {
		this.route('index');
	});
});

App.IndexRoute = AppRoute.extend({
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