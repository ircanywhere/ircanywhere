App.UserlistController = Ember.ArrayController.extend({
	needs: ['index', 'network', 'tab'],
	tabs: [],
	users: [],

	filtered: Ember.arrayComputed('sorted', 'controllers.index.tabId', {
		addedItem: function(accum, item) {
			var tab = this.get('tabs').filterProperty('_id', this.get('controllers.index.tabId'))[0];

			if (tab && item.network === tab.networkName && item.channel === tab.title) {
				accum.pushObject(item);
			}

			return accum;
		},
		
		removedItem: function(accum, item) {
			var tab = this.get('tabs').filterProperty('_id', this.get('controllers.index.tabId'))[0];

			if (tab && item.network === tab.networkName && item.channel === tab.title) {
				accum.removeObject(item);
			}

			return accum;
		}
	}),

	sorted: function() {
		var results = this.get('users'),
			sorted = Ember.ArrayProxy.createWithMixins(Ember.SortableMixin, {
				content: results,
				sortProperties: ['sort', 'nickname'],
				sortAscending: true
			});

		return sorted;
	}.property('users').cacheable(),

	ready: function() {
		this.set('users', this.socket.findAll('channelUsers'));
		this.set('tabs', this.socket.findAll('tabs'));
	}
});