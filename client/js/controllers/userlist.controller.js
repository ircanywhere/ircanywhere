App.UserlistController = Ember.ArrayController.extend({
	needs: ['index', 'network', 'tab'],

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
		initialize: function(array, changeMeta, instanceMeta) {
			if (!this.get('controllers.index.tabId')) {
				return false;
			}

			instanceMeta.tab = this.get('socket.tabs').findBy('_id', this.get('controllers.index.tabId'));

			return instanceMeta;
		},

		addedItem: function(accum, item, changeMeta, instanceMeta) {
			var tab = instanceMeta.tab;

			if (tab && item.network === tab.networkName && item.channel === tab.target) {
				accum.pushObject(item);
			}

			return accum;
		},
		
		removedItem: function(accum, item, changeMeta, instanceMeta) {
			var tab = instanceMeta.tab;

			if (tab && item.network === tab.networkName && item.channel === tab.target) {
				accum.removeObject(item);
			}

			return accum;
		}
	}),

	sorted: function() {
		var results = this.get('channelUsers'),
			sorted = Ember.ArrayProxy.createWithMixins(Ember.SortableMixin, {
				content: results,
				sortProperties: ['sort', 'nickname'],
				sortAscending: true
			});

		return sorted;
	}.property('channelUsers').cacheable(),

	onPart: function(object, backlog) {
		this._onRemove(object, backlog);
	},

	onQuit: function(object, backlog) {
		this._onRemove(object, backlog);
	},

	ready: function() {
		this.set('channelUsers', this.socket.channelUsers);
	},
	
	updated: function() {
		this.set('channelUsers', this.socket.channelUsers);
	},

	_onRemove: function(object, backlog) {
		if (!backlog && object.get('extra.self') === true) {
			var network = object.get('network'),
				channel = object.get('message.channel'),
				users = this.channelUsers;

			if (users) {
				var objects = users.filter(function(i) {
					return (network == i.network && channel == i.channel);
				});

				users.removeObjects(objects);
			}
		}
		// only target our parts / quits
	}
});