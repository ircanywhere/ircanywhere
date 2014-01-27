App.MessagesController = Ember.ArrayController.extend({
	needs: ['index'],
	tabs: [],
	events: [],

	filtered: Ember.arrayComputed('sorted', 'controllers.index.tabId', {
		addedItem: function(accum, item) {
			var tab = this.get('tabs').filterProperty('_id', this.get('controllers.index.tabId'))[0];

			if (tab && item.network === tab.networkName && item.target === tab.title) {
				accum.pushObject(item);
			}

			return accum;
		},
		
		removedItem: function(accum, item) {
			var tab = this.get('tabs').filterProperty('_id', this.get('controllers.index.tabId'))[0];

			if (tab && item.network === tab.networkName && item.target === tab.title) {
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
	}.property('events').cacheable(),

	ready: function() {
		this.set('tabs', this.socket.findAll('tabs'));
		this.set('events', this.socket.findAll('events'));
		// we have to use the direct data set for events because we wont be able to
		// take advantage of it's live pushing and popping
		// ie new events immediately becoming visible with no effort
	}
});