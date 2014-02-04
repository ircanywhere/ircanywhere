App.Router.map(function() {
	this.resource('network', {path: '/t/:url'}, function() {
		this.resource('tab', {path: '/:tab'});
	});
});

App.NetworkRoute = AppRoute.extend({
	setupController: function(controller, model) {
		var index = this.controllerFor('index'),
			socket = index.socket,
			tab = socket.findOne('tabs', {url: model.get('url')}),
			selected = socket.findOne('tabs', {selected: true});

		if (selected.get('_id') !== tab.get('_id')) {
			socket.findAll('tabs').setEach('selected', false);
			tab.set('selected', true);
			// update our local storage immediately so we dont get a delay on tab change

			index.socket.update('tabs', {_id: tab.get('_id')}, {selected: true});
			// send the update to the backend
		}
		// get the tab model

		controller.set('model', model);
	},

	model: function(params) {
		return this.controllerFor('index').socket.findButWait('networks', {url: params.url}, true);
	},

	title: function(controller, model) {
		return model.get('name') + ' - ' + App.get('defaultTitle');
	},

	actions: {
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