App.Router.map(function() {
	this.resource('tab', {path: '/t/:url'}, function() {
		this.resource('channel', {path: '/:tab'});
	});
});

App.TabRoute = AppRoute.extend({
	setupController: function(controller, model) {
		controller.set('model', model[0]);
	},

	model: function(params) {
		return this.controllerFor('index').socket.findButWait('networks', {url: params.url});
	},

	title: function(controller, model) {
		return model[0].get('name') + ' - ' + App.get('defaultTitle');
	}
});