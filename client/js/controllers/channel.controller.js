App.ChannelController = Ember.ArrayController.extend({
	events: [],

	ready: function() {
		//this.set('events', this.socket.findAll('events'));
	}
});