App.Router.map(function() {
	this.resource('network', {path: '/t/:url'}, function() {
		this.resource('tab', {path: '/:tab'});
	});
});

App.NetworkRoute = AppRoute.extend({
	setupController: function(controller, model) {
		controller.set('model', model);
	},

	model: function(params) {
		return this.controllerFor('index').socket.findButWait('networks', {url: params.url}, true);
	},

	title: function(controller, model) {
		return model.get('name') + ' - ' + App.get('defaultTitle');
	},

	actions: {
		willTransition: function(transition) {
			var parts = transition.providedModelsArray,
				url = (parts.length === 1) ? parts[0] : parts[0] + '/' + decodeURIComponent(parts[1]),
				index = this.controllerFor('index'),
				socket = index.socket,
				tab = socket.findOne('tabs', {url: url});

			socket.findAll('tabs').setEach('selected', false);
			tab.set('selected', true);
			// mark all but this as selected

			index.set('tabId', tab._id);
			index.socket.update('tabs', {_id: tab._id}, {selected: true});
			// send update to backend
		},

		markAsRead: function(id) {
			this.controller.markAllAsRead(id);
		},

		gotoUnread: function(id) {
			this.controller.gotoUnread(id);
		},

		gotoHighlight: function(id) {
			this.controller.gotoHighlight(id);
		}
	}
});