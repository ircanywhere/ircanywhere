App.TabController = Ember.ArrayController.extend({
	title: 'dawg',

	results: [],

	init: function() {
		this.set('results', this.socket.findAll('channelUsers'));
	}
});