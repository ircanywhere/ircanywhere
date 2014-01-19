App.Router.map(function() {
	this.resource('tab', {path: '/t/:network'}, function() {
		this.route('tab', {path: '/:channel'});
	});
});

App.TabRoute = AppRoute.extend({
	model: function() {
		return this.controllerFor('index').socket.connect();
	},

	activate: function() {
		console.log(document.location)
	},

	actions: {
		error: function(reason) {
			this.transitionToRoute('login');
		},

		loading: function(transition, original) {
			return true;
		}
	},
	
	title: function(controller, model) {
		return controller.get('title');
	}
});