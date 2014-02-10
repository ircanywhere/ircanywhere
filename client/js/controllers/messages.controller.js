App.MessagesController = Ember.ArrayController.extend({
	needs: ['index'],
	tabs: [],
	events: [],
	readDocs: [],

	filtered: Ember.arrayComputed('events', 'controllers.index.tabId', {
		addedItem: function(accum, item) {
			var tab = this.get('tabs').filterProperty('_id', this.get('controllers.index.tabId'))[0],
				network = this.socket.findOne('networks', {_id: tab.network});

			if (!tab) {
				return accum;
			}
				
			if (item.network === tab.networkName &&
				((tab.type === 'network' && item.target === '*') ||
				(tab.type === 'query' && (item.target === tab.target || (item.target === network.nick && item.message.nickname.toLowerCase() === tab.target))) ||
				(tab.type === 'channel' && item.target === tab.target))) {
				// messy conditional
				accum.pushObject(item);
			}

			return accum;
		},
		
		removedItem: function(accum, item) {
			var tab = this.get('tabs').filterProperty('_id', this.get('controllers.index.tabId'))[0],
				network = this.socket.findOne('networks', {_id: tab.network});

			if (!tab) {
				return accum;
			}
				
			if (item.network === tab.networkName &&
				((tab.type === 'network' && item.target === '*') ||
				(tab.type === 'query' && (item.target === tab.target || (item.target === network.nick && item.message.nickname.toLowerCase() === tab.target))) ||
				(tab.type === 'channel' && item.target === tab.target))) {
				// messy conditional
				accum.removeObject(item);
			}

			return accum;
		}
	}),

	sorted: function() {
		var results = this.get('filtered'),
			sorted = Ember.ArrayProxy.createWithMixins(Ember.SortableMixin, {
				content: results,
				sortProperties: ['message.time'],
				sortAscending: true
			});

		return sorted;
	}.property('filtered').cacheable(),

	ready: function() {
		this.set('tabs', this.socket.findAll('tabs'));
		this.set('events', this.socket.findAll('events'));
		// we have to use the direct data set for events because we wont be able to
		// take advantage of it's live pushing and popping
		// ie new events immediately becoming visible with no effort
	},

	markAsRead: function() {
		var query = {'$or': []};
		this.get('readDocs').forEach(function(id) {
			query['$or'].push({_id: id});
		});
		// construct a query from docs

		if (this.get('readDocs').length > 0) {
			this.socket.update('events', query, {read: true});
			this.set('readDocs', []);
		}
		// send the update out
	},

	actions: {
		detectUnread: function(id, top, bottom, container) {
			var self = this,
				tab = this.get('tabs').filterProperty('_id', id)[0],
				events = this.get('sorted').filterProperty('unread', true),
				counter = 0;
				docs = [];

			if (!tab) {
				return false;
			}

			events.forEach(function(item) {
				var el = container.find('div.row[data-id=' + item._id + ']');

				if (el.get(0)) {
					var topOffset = el[0].offsetTop;

					if ((top === 0 || top < topOffset && topOffset < bottom) && App.get('isActive')) {
						// XXX - Handle highlights

						item.set('unread', false);
						if (self.readDocs.indexOf(item._id) === -1) {
							self.readDocs.push(item._id);
							counter++;
						}
					}
				}
			});

			var unread = tab.get('unread') - counter;
				unread = (unread <= 0) ? 0 : unread;
				tab.set('unread', unread);
			// update the icon
			
			if (this.get('timeout')) {
				return false;
			}
			// already a pending timeout

			var scrollTimeout = setTimeout(function() {
				self.markAsRead();
				self.set('timeout', null);
			}, 5000);

			this.set('timeout', scrollTimeout);
		}
	}
});