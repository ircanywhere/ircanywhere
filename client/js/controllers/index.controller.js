App.IndexController = Ember.ArrayController.extend({
	results: [],

	init: function() {
		this.set('results', this.socket.get('channelUsers'));
	}
});