App.TabController = Ember.ArrayController.extend({
	title: 'dawg',
	actions: {},

	filteredContent: Ember.computed.filterBy('content', 'channel', '#ircanywhere-test'),
	// filter it to a specific channel

	events: {
		ready: function() {
			this.set('content', this.socket.findAll('channelUsers'));
			// set the content when we're ready
		}
	}
});