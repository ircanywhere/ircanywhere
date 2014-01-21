App.MessagesController = Ember.ArrayController.extend({
	needs: ['channel', 'tab'],
	events: [],

	filtered: function() {
		var network = this.get('controllers.tab.model'),
			tab = this.get('controllers.channel.model');

		var events = this.get('events').filter(function(item) {
			if (tab && (item.get('network') === network.get('name') && item.get('target') === tab.get('title'))) {
				return true;
			} else if (!tab && (item.get('network') === network.get('name') && item.get('target') === network.get('name'))) {
				return true;
			} else {
				return false;
			}
		});

		return events;
	}.property('events.@each', 'controllers.channel.model', 'controllers.tab.model').cacheable(),

	ready: function() {
		this.set('events', this.socket.findAll('events'));
	}
});

Ember.Handlebars.helper('json', function(value, options) {
	return JSON.stringify(value);
});