App.UserlistController = Ember.ArrayController.extend({
	needs: ['index', 'network', 'tab'],
	tabs: [],
	users: [],

	userCount: function() {
		return this.get('filtered').length;
	}.property('filtered').cacheable(),

	owners: Ember.computed.filterBy('filtered', 'sort', 1),
	admins: Ember.computed.filterBy('filtered', 'sort', 2),
	operators: Ember.computed.filterBy('filtered', 'sort', 3),
	halfops: Ember.computed.filterBy('filtered', 'sort', 4),
	voiced: Ember.computed.filterBy('filtered', 'sort', 5),
	normal: Ember.computed.filterBy('filtered', 'sort', 6),

	displayHeading: function() {
		return (this.get('filtered.length') !== this.get('normal.length'));
	}.property('filtered.length', 'normal.length'),

	filtered: Ember.arrayComputed('sorted', 'controllers.index.tabId', {
		addedItem: function(accum, item) {
			var tab = this.get('tabs').filterProperty('_id', this.get('controllers.index.tabId'))[0];

			if (tab && item.network === tab.networkName && item.channel === tab.target) {
				accum.pushObject(item);
			}

			return accum;
		},
		
		removedItem: function(accum, item) {
			var tab = this.get('tabs').filterProperty('_id', this.get('controllers.index.tabId'))[0];

			if (tab && item.network === tab.networkName && item.channel === tab.target) {
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