App.UserlistController = Ember.ArrayController.extend({
	needs: ['index', 'network', 'tab'],
	tabs: [],
	users: [],
	last: null,

	userCount: function() {
		return this.get('filtered').length;
	}.property('filtered').cacheable(),

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
	},

	actions: {
		goto: function(url) {
			url = url.substring(3);
			// cut the /t/ off the front

			var split = url.split('/');

			if (split.length === 1) {
				this.transitionToRoute('network', split[0]);
			} else {
				this.transitionToRoute('tab', split[0], split[1]);
			}
		}
	}
});