App.TabRoute = AppRoute.extend({
	setupController: function(controller, model) {
		controller.set('model', model[0]);
	},
	
	model: function(params) {
		var self = this,
			network = this.modelFor('network')[0];
		
		return new Ember.RSVP.Promise(function(resolve, reject) {
			var result = self.controllerFor('index').socket.find('tabs', {network: network.get('_id'), title: decodeURIComponent(params.tab)});
			
			if (result) {
				resolve(result);
			} else {
				reject();
			}
		});
		// We don't actually NEED to return a promise here because we know that the socket has emitted
		// the done event because this route had to wait for tab route to resolve, however we will still wrap
		// it in a promise so we can make use of loading screens and errors if we need to do so in the future
		// and it keeps things organised and conformed
	},

	activate: function() {
		var socket = this.controllerFor('index').socket,
			selected = socket.find('tabs', {selected: true})[0],
			model = this.modelFor('tab')[0];
		// get the channel model

		if (selected.get('_id') !== model.get('_id')) {
			socket.update('tabs', {_id: model.get('_id')}, {selected: true});
		}
	},

	deactivate: function() {
		var model = this.modelFor('network')[0];
		// get the tab model

		this.controllerFor('tab').set('model', null);
		this.controllerFor('index').socket.update('tabs', {url: model.get('url')}, {selected: true});
	},

	title: function(controller, model) {
		return model[0].get('target') + ' - ' + App.get('defaultTitle');
	}
});