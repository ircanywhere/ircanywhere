App.TabRoute = AppRoute.extend({
	setupController: function(controller, model) {
		this.controllerFor('index').socket.findAll('tabs').setEach('selected', false);
		model.set('selected', true);
		// update our local storage immediately so we dont get a delay on tab change

		controller.set('model', model);
	},
	
	model: function(params) {
		var self = this,
			index = this.controllerFor('index'),
			network = this.modelFor('network');
		
		return new Ember.RSVP.Promise(function(resolve, reject) {
			var result = index.socket.find('tabs', {network: network.get('_id'), title: decodeURIComponent(params.tab)});
			if (result.length) {
				resolve(result[0]);
			} else {
				reject('not found');
			}
		});
		// We don't actually NEED to return a promise here because we know that the socket has emitted
		// the done event because this route had to wait for tab route to resolve, however we will still wrap
		// it in a promise so we can make use of loading screens and errors if we need to do so in the future
		// and it keeps things organised and conformed
	},

	activate: function() {
		var index = this.controllerFor('index'),
			socket = index.socket,
			selected = socket.findOne('tabs', {selected: true}),
			model = this.modelFor('tab');
		// get the channel model

		if (selected.get('_id') !== model.get('_id')) {
			socket.update('tabs', {_id: model.get('_id')}, {selected: true});
			// send the update to the backend
		}

		index.set('tabId', model.get('_id'));
	},

	deactivate: function() {
		var index = this.controllerFor('index'),
			socket = index.socket,
			tab = socket.findOne('tabs', {url: this.modelFor('network').get('url')}),
			selected = socket.findOne('tabs', {selected: true});
		// get the tab model

		if (selected.get('_id') !== tab.get('_id')) {
			socket.findAll('tabs').setEach('selected', false);
			tab.set('selected', true);
			// update our local storage immediately so we dont get a delay on tab change

			index.socket.update('tabs', {_id: tab.get('_id')}, {selected: true});
			// send the update to the backend
		}

		index.set('tabId', tab.get('_id'));
	},

	title: function(controller, model) {
		return model.get('target') + ' - ' + App.get('defaultTitle');
	},

	actions: {
		error: function(error, transition) {
			var socket = this.controllerFor('index').socket,
				target = transition.params.tab,
				network = this.modelFor('network').get('_id');

			socket.insert('tabs', {target: target, network: network, selected: true});
		}
	}
});