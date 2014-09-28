App.TabRoute = AppRoute.extend({
	init: function() {
		this.controllerFor('index').determinePath();
	},
	
	setupController: function(controller, model) {
		controller.set('model', model);
	},
	
	model: function(params) {
		var index = this.controllerFor('index'),
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

	renderTemplate: function() {
		this.controllerFor('network').onUnreadChange();
		this.render();
	},

	actions: {
		willTransition: function(transition) {
			var params = transition.params,
				parts = [],
				url;

			if (params.network && params.network.url) {
				parts.push(params.network.url);
			}

			if (params.tab && params.tab.tab) {
				parts.push(params.tab.tab);
			}

			if (parts.length === 0) {
				url = (!params.tab) ? params.url : params.url + '/' + Helpers.decodeChannel(params.tab).toLowerCase();
			} else if (parts.length === 1) {
				url = parts[0];
			} else {
				url = parts[0] + '/' + Helpers.decodeChannel(parts[1]).toLowerCase();
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

			this.controllerFor('network').onUnreadChange();
		},

		error: function(error, transition) {
			var socket = this.controllerFor('index').socket,
				target = transition.params.tab,
				network = this.modelFor('network').get('_id');

			socket.send('insertTab', {target: target.tab, network: network, selected: true});
		}
	}
});