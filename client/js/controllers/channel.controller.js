App.ChannelController = Ember.ArrayController.extend({
	title: 'dawg',

	filteredContent: Ember.computed.filterBy('content', 'channel', '#ircanywhere-test'),
	// filter it to a specific channel

	ready: function() {
		this.set('content', this.socket.findAll('events'));
		// set the content when we're ready
	}
});