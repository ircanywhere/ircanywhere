App.Router.map(function() {
	this.resource('tab', {path: '/t/:url'}, function() {
		this.resource('channel', {path: '/:title'});
	});
});

App.TabRoute = AppRoute.extend({
	model: function(params) {
		return this.controllerFor('tab').socket.findButWait('networks', {url: params.url});
	},

	title: function(controller, model) {
		return 'wat';
	}
});

App.ChannelRoute = AppRoute.extend({
	model: function(params) {
		var self = this,
			network = this.modelFor('tab')[0];
		
		return new Ember.RSVP.Promise(function(resolve, reject) {
			var result = self.controllerFor('tab').socket.find('tabs', {network: network.get('_id'), title: decodeURIComponent(params.title)});
			
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
	}
});