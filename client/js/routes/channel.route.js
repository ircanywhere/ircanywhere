App.ChannelRoute = AppRoute.extend({
	model: function(params) {
		var self = this,
			network = this.modelFor('tab')[0];
		
		return new Ember.RSVP.Promise(function(resolve, reject) {
			var result = self.controllerFor('channel').socket.find('tabs', {network: network.get('_id'), title: decodeURIComponent(params.title)});
			
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
		var model = this.modelFor('channel')[0];
		// get the channel model

		this.controllerFor('channel').socket.update('tabs', {_id: model.get('_id')}, {selected: true});
	},

	deactivate: function() {
		var model = this.modelFor('tab')[0];
		// get the tab model

		this.controllerFor('channel').socket.update('tabs', {url: model.get('url')}, {selected: true});
	}
});