App.TabRoute = AppRoute.extend({
	init: function() {
		this.controllerFor('index').determinePath();
	},
	
	setupController: function(controller, model) {
		controller.set('model', model);
	},
	
	model: function(params) {
		var self = this,
			index = this.controllerFor('index'),
			network = this.modelFor('network');

		return new Ember.RSVP.Promise(function(resolve, reject) {
			var result = index.socket.find('tabs', {network: network.get('_id'), target: Helpers.decodeChannel(params.tab).toLowerCase()});
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
			var params = transition.params,
				parts = transition.providedModelsArray;

			if (parts.length === 0) {
				var url = (!params.tab) ? params.url : params.url + '/' + Helpers.decodeChannel(params.tab).toLowerCase();
			} else if (parts.length === 1) {
				var url = parts[0];
			} else {
				var url = parts[0] + '/' + Helpers.decodeChannel(parts[1]).toLowerCase();
			}
			// attempt to construct a url from resolves models or parameters

			var index = this.controllerFor('index'),
				socket = index.socket,
				tab = socket.tabs.findBy('url', url);

			if (!tab || tab && tab.selected) {
				return false;
			}

			socket.get('users').setEach('selectedTab', url);
			tab.set('requestedBacklog', false);
			tab.set('messageLimit', 50);
			// mark tab as selected and reset some tab related settings

			index.set('tabId', tab._id);
			index.socket.send('selectTab', tab.url);
			// send update to backend
		},

		error: function(error, transition) {
			var socket = this.controllerFor('index').socket,
				target = transition.params.tab,
				network = this.modelFor('network').get('_id');

			socket.send('insertTab', {target: target, network: network, selected: true});
		}
	}
});