App.MessagesController = Ember.ArrayController.extend({
	needs: ['channel', 'tab'],
	events: [],

	/*filteredContent: Ember.arrayComputed('events.[]', {
		initialValue: [],
		addedItem: function(accum, item) {
			if (item.network === 'unique') {
				accum.pushObject(item);
			}
			return accum;
		},
		removedItem: function(accum, item) {
			accum.removeObject(item);
			return accum;
		}
	}),*/

	getEvents: function() {
		var networkModel = this.get('controllers.tab.model'),
			tabModel = this.get('controllers.channel.model'),
			events = this.socket.findAll('events');

		this.set('events', events);
	}.observes('controllers.channel.model', 'controllers.tab.model')
});

Ember.Handlebars.helper('json', function(value, options) {
	return JSON.stringify(value);
});