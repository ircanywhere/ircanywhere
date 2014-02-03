App.MessagesController = Ember.ArrayController.extend({
	needs: ['index'],
	tabs: [],
	events: [],

	filtered: Ember.arrayComputed('sorted', 'controllers.index.tabId', {
		addedItem: function(accum, item) {
			var tab = this.get('tabs').filterProperty('_id', this.get('controllers.index.tabId'))[0],
				target = (tab && tab.type === 'network') ? '*' : tab.title;
				
			if ((item.type === 'privmsg' || item.type === 'action' || item.type === 'notice') && !item.read) {
				item.set('unread', true);
				item.set('read', true);
			}

			if (tab && item.network === tab.networkName && item.target === target) {
				accum.pushObject(item);
			}

			return accum;
		},
		
		removedItem: function(accum, item) {
			var tab = this.get('tabs').filterProperty('_id', this.get('controllers.index.tabId'))[0],
				target = (tab && tab.type === 'network') ? '*' : tab.title;

			if (tab && item.network === tab.networkName && item.target === target) {
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
	},

	markAsRead: function(docs) {
		var query = {'$or': []};
		docs.forEach(function(id) {
			query['$or'].push({_id: id});
		});
		// construct a query from docs

		if (docs.length > 0) {
			//this.socket.update('events', query, {read: true});
		}
		// send the update out
	},

	actions: {
		detectUnread: function(id, top, bottom, container) {
			var self = this,
				tab = this.get('tabs').filterProperty('_id', id)[0],
				events = this.get('filtered').filterProperty('unread', true),
				docs = [];

			events.forEach(function(item) {
				var el = container.find('div.row[data-id=' + item._id + ']'),
					topOffset = el[0].offsetTop;

				if (top === 0 || top < topOffset && topOffset < bottom) {
					// XXX - Handle highlights

					item.set('unread', false);
					docs.push(item._id);
				}
			});

			var unread = tab.get('unread') - docs.length;
			tab.set('unread', unread);
			// update the icon

			if (unread > 0) {
				clearTimeout(this.scrollTimeout);
				this.scrollTimeout = setTimeout(function() {
					self.markAsRead(docs);
				}, 5000);
			}
			// send to server*/
		}
	}
});