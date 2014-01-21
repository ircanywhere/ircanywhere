App.MessagesController = Ember.ArrayController.extend({
	needs: ['channel', 'tab'],
	events: [],

	filtered: Ember.arrayComputed('sorted', 'controllers.tab.model', 'controllers.channel.model', {
		addedItem: function(accum, item) {
			var network = this.get('controllers.tab.model'),
				tab = this.get('controllers.channel.model');

			if ((tab && item.network === network.name && item.target === tab.title) ||
				(!tab && item.network === network.name && item.target === network.name)) {
				accum.pushObject(item);
			}

			return accum;
		},
		
		removedItem: function(accum, item) {
			var network = this.get('controllers.tab.model'),
				tab = this.get('controllers.channel.model');

			if ((tab && item.network === network.name && item.target === tab.title) ||
				(!tab && item.network === network.name && item.target === network.name)) {
				accum.removeObject(item);
			}

			return accum;
		}
	}),

	sorted: function() {
		var results = this.get('events'),
			sorted = Ember.ArrayProxy.createWithMixins(Ember.SortableMixin, {
				content: results,
				sortProperties: ['message.time'],
				sortAscending: true
			});

		return sorted;
	}.property('events'),

	ready: function() {
		this.set('events', this.socket.findAll('events'));
		// we have to use the direct data set for events because we wont be able to
		// take advantage of it's live pushing and popping
		// ie new events immediately becoming visible with no effort
	}
});