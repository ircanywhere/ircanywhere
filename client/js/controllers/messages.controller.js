App.MessagesController = Ember.ArrayController.extend(App.Notification, {
	needs: ['index', 'network'],
	events: [],
	readDocs: [],
	unreadNotifications: [],

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

			if ((item.network === tab.network || item.network === network._id) &&
				((tab.type === 'network' && item.target === '*') ||
				(tab.type === 'query' && (Helpers.compareStrings(item.target, tab.target, true) || (Helpers.compareStrings(item.target, network.nick, true) && Helpers.compareStrings(item.message.nickname, tab.target, true)))) ||
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
				
			if ((item.network === tab.network || item.network === network._id) &&
				((tab.type === 'network' && item.target === '*') ||
				(tab.type === 'query' && (Helpers.compareStrings(item.target, tab.target, true) || (Helpers.compareStrings(item.target, network.nick, true) && Helpers.compareStrings(item.message.nickname, tab.target, true)))) ||
				(tab.type === 'channel' && item.target === tab.target))) {
				// messy conditional
				accum.removeObject(item);
			}

			return accum;
		}
	}),

	filtered: function() {
		var tab = this.get('socket.tabs').findBy('selected', true);

		if (!tab) {
			return Ember.A();
		}

		var events = this.get('content'),
			limit = (tab) ? tab.get('messageLimit', 50) : 50,
			slice = events.length - limit;
			slice = (slice < 0 || tab.get('requestedBacklog')) ? 0 : slice;

		var proxy = Ember.ArrayProxy.createWithMixins(Ember.SortableMixin, {
			content: events,
			sortProperties: ['message.time'],
			sortAscending: true
		});

		return proxy.slice(slice);
	}.property('content.@each', 'controllers.index.tabId', 'socket.tabs.@each.messageLimit'),

	markAsRead: function() {
		var query = {'$in': []};
		this.get('readDocs').forEach(function(id) {
			query.$in.push(id);
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
			var tab = this.get('socket.tabs').findBy('selected', true),
				count = 50,
				container = Ember.$('.inside-backlog');

			if (!tab || tab.loading) {
				return false;
			}

			var query = Ember.copy(tab.query),
				contentLength = this.get('content').length,
				filteredLength = this.get('filtered').length,
				top = container.find('div.row:first').attr('data-id'),
				item = this.socket.events.findBy('_id', top);
			// get some query variables

			if (contentLength > 0) {
				query['message.time'] = {$lt: item.message.time};
			}

			tab.set('requestedBacklog', true);
			tab.set('loading', true);
			tab.set('preBacklogId', top);
			// record the scroll position by remembering what the top id was

			if (contentLength > filteredLength) {
				tab.set('messageLimit', contentLength);
				this.updated();
			} else if (contentLength === 0 || filteredLength === 0 || contentLength <= filteredLength) {
				tab.set('messageLimit', tab.messageLimit + count);
				this.socket.send('getEvents', query, count);
			}
		},

		detectUnread: function(id, top, bottom) {
			var self = this,
				tab = this.get('socket.tabs').findBy('_id', id),
				events = this.get('filtered').filterProperty('read', false),
				highlightCounter = 0,
				counter = 0;

			if (!tab) {
				return false;
			}

			events.forEach(function(item) {
				var el = Ember.$('div.row[data-id=' + item._id + ']'),
					type = el.attr('data-type');

				if ((type === 'privmsg' || type === 'action' || type === 'notice') && el.get(0)) {
					var topOffset = el[0].offsetTop;

					if ((top < topOffset && topOffset < bottom) && self.get('controllers.index.isActive')) {
						item.set('read', true);
						
						if (self.readDocs.indexOf(item._id) === -1) {
							self.readDocs.push(item._id);
							counter++;

							if (item.extra.highlight) {
								highlightCounter++;
							}
						}
						// do all our housekeeping, mark the message as read etc

						self.get('socket.emitter').trigger('eventVisible', item._id, item);
						// emit an event for any listeners looking for a specific event to be read
					}
				}
			});

			var unread = tab.get('unread', 0) - counter;
				unread = (unread <= 0) ? 0 : unread;
				tab.set('unread', unread);

			var highlights = tab.get('highlights', 0) - highlightCounter;
				highlights = (highlights <= 0) ? 0 : highlights;
				tab.set('highlights', highlights);
			// update the icon(s)
			
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

	showUnreadBar: function () {
		var self = this;

		Ember.run.later(self, function() {
			var unread = this.get('controllers.network.selectedTab.unread');
			self.set('controllers.network.unreadBar', (unread > 0));
		}, 250);
	}.observes('controllers.network.selectedTab.unread'),

	ready: function() {
		this.set('events', this.socket.get('events'));
	},

	updated: function() {
		var tab = this.get('controllers.network.selectedTab'),
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
	},

	newTabMessage: function(object) {
		var self = this;

		if (this.get('controllers.index.isActive') || !(object.get('extra.highlight') && (!object.read || object.unread))) {
			return false;
		}

		var title = object.get('message.nickname') + ' - ' + object.target,
			Notify = this.notify(title, {
				body: object.get('message.message'),
				tag: object._id + '/' + object.target,
				id: object._id,
				timeout: 5,
				onClose: function(obj) {
					self.unreadNotifications.removeObject(obj);
				}
			});

		this.unreadNotifications.pushObject(Notify);
		// show notification
	},

	onHighlightBurst: function(object, backlog) {
		this.newTabMessage(object, backlog);
	},

	onNotice: function(object, backlog) {
		if (!backlog) {
			this.newTabMessage(object, backlog);
		}
	},

	onAction: function(object, backlog) {
		if (!backlog) {
			this.newTabMessage(object, backlog);
		}
	},

	onPrivmsg: function(object, backlog) {
		if (!backlog) {
			this.newTabMessage(object, backlog);
		}
	},

	onEventVisible: function(id, item) {
		var self = this;

		if (!item.get('extra.highlight')) {
			return false;
		}
		// we're not bothered about non-highlights

		var tab = this.get('socket.tabs').findBy('_id', this.get('controllers.index.tabId'));

		this.unreadNotifications.forEach(function(item) {
			if (!(self.get('controllers.index.isActive') && item.tag === tab.network + '/' + tab.title)) {
				return false;
			}
			// tab or window isnt active

			item.close();
		});
	}
});

App.injectController('messages');
