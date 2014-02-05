App.TabRoute = AppRoute.extend({
	setupController: function(controller, model) {
		controller.set('model', model);
	},
	
	model: function(params) {
		var self = this,
			index = this.controllerFor('index'),
			network = this.modelFor('network');

		return new Ember.RSVP.Promise(function(resolve, reject) {
			var result = index.socket.find('tabs', {network: network.get('_id'), target: decodeURIComponent(params.tab).toLowerCase()});
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

	title: function(controller, model) {
		return model.get('target') + ' - ' + App.get('defaultTitle');
	},

	actions: {
		willTransition: function(transition) {
			var parts = transition.providedModelsArray,
				url = (parts.length === 1) ? parts[0] : parts[0] + '/' + decodeURIComponent(parts[1]).toLowerCase(),
				index = this.controllerFor('index'),
				socket = index.socket,
				tab = socket.findOne('tabs', {url: url});

			if (parts.length === 0) {
				return transition.abort();
			}

			if (!tab || tab && tab.selected) {
				return false;
			}

			console.log(transition.providedModelsArray, tab);

			socket.findAll('tabs').setEach('selected', false);
			tab.set('selected', true);
			// mark all but this as selected

			index.set('tabId', tab._id);
			index.socket.update('tabs', {_id: tab._id}, {selected: true});
			// send update to backend
		},

		error: function(error, transition) {
			var socket = this.controllerFor('index').socket,
				target = transition.params.tab,
				network = this.modelFor('network').get('_id');

			socket.insert('tabs', {target: target, network: network, selected: true});
		}
	}
});