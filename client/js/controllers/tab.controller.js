App.TabController = Ember.ArrayController.extend({
	title: 'dawg',
	actions: {},

	arrayContentWillChange: function(startIdx, removeAmt, addAmt) {
		console.log(startIdx, removeAmt, addAmt);
	},

	filteredContent: Ember.computed.filterBy('content', 'channel', '#ircanywhere-test'),

	events: {
		ready: function() {
			var result = this.socket.findAll('channelUsers');
			
			this.set('content', result);
		}
	}
});