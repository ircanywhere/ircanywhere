App.MessagesController = Ember.ArrayController.extend({
	needs: ['index'],
	events: [],
	readDocs: [],

	sortProperties: ['message.time'],
	sortAscending: true,

	content: Ember.arrayComputed('events', 'controllers.index.tabId', {
		initialize: function(array, changeMeta, instanceMeta) {
			if (!this.get('controllers.index.tabId')) {
				return false;
			}

			var tab = this.get('socket.tabs').findBy('_id', this.get('controllers.index.tabId')),
				network = this.get('socket.networks').findBy('_id', tab.network);

			instanceMeta.tab = tab;
			instanceMeta.network = network;

			return instanceMeta;
		},

		addedItem: function(accum, item, changeMeta, instanceMeta) {
			var tab = instanceMeta.tab,
				network = instanceMeta.network;

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
		
		removedItem: function(accum, item, changeMeta, instanceMeta) {
			var tab = instanceMeta.tab,
				network = instanceMeta.network;

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

	markAsRead: function() {
		var query = {'$in': []};
		this.get('readDocs').forEach(function(id) {
			query['$in'].push(id);
		});
		// construct a query from docs

		if (this.get('readDocs').length > 0) {
			this.socket.send('readEvents', query, {read: true});
			this.set('readDocs', []);
		}
		// send the update out
	},

	actions: {
		loadBacklog: function() {
			var tab = this.get('parentController.selectedTab'),
				container = Ember.$('.inside-backlog');

			if (!tab || tab.loading || container.length === 0) {
				return false;
			}

			var query = Ember.copy(tab.query),
				top = container.find('div.row:first').attr('data-id'),
				item = this.socket.events.findBy('_id', top),
				query = {'message.time': {$lt: item.message.time}};
			// get some query variables

			tab.set('loading', true);
			tab.set('preBacklogId', top);
			// record the scroll position by remembering what the top id was

			this.socket.send('getEvents', query, 50);
		},

		detectUnread: function(id, top, bottom, container) {
			var self = this,
				tab = this.get('socket.tabs').findBy('_id', id),
				events = this.get('content').filterProperty('unread', true),
				counter = 0;
				docs = [];

			if (!tab) {
				return false;
			}

			events.forEach(function(item) {
				var el = container.find('div.row[data-id=' + item._id + ']'),
					type = el.attr('data-type');

				if (type !== 'privmsg' && type !== 'action' && type !== 'notice') {
					return;
				}

				if (el.get(0)) {
					var topOffset = el[0].offsetTop;

					if (top === 0 || top < topOffset && topOffset < bottom) {
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
			}, 2500);

			this.set('timeout', scrollTimeout);
		}
	},

	ready: function() {
		this.set('events', this.socket.get('events'));
	},

	updated: function() {
		var tab = this.get('parentController.selectedTab'),
			container = Ember.$('.backlog');

		if (!tab || tab.loading === false || container.length === 0) {
			return false;
		}

		if (tab.preBacklogId) {
			Ember.run.later(function() {
				var element = container.find('div.row[data-id=' + tab.preBacklogId + ']');
				container[0].scrollTop = element[0].offsetTop;
			}, 100);
		}

		tab.set('loading', false);
	}
});