App.SidebarController = Ember.ArrayController.extend({
	newUnreadItem: function() {
		var tabs = this.get('content'),
			events = this.get('events'),
			i = 0,
			hl = 0;
			
		var filtered = events.filter(function(item) {
			if ((item.type === 'notice' || item.type === 'privmsg' || item.type === 'action') && (!item.read || item.unread)) {
				item.set('unread', true);
				item.set('read', true);
				return true;
			}

			return false;
		});
		// filter the events

		tabs.forEach(function(tab) {
			i = 0;
			hl = 0;
			
			filtered.forEach(function(item) {
				if (tab.type === 'channel' && item.network === tab.networkName && item.target === tab.title) {
					i++;
					tab.set('unread', i);

					if (item.extra.highlight) {
						hl++;
						tab.set('highlights', hl);
					}
				}
			});

			if (i > tab.unread) {
				tab.set('unread', tab.unread);
			}

			if (hl > tab.highlights) {
				tab.set('highlights', tab.highlights);
			}
		});
		// XXX - I'm kind of unhappy about this loop inside a loop, this will be replaced though
		// 		 when I write the event emitter, we'll probably just use that to calculate unreads etc
		//		 NOTE - I'm also not using .get() here to speed things up.
	}.observes('events.length'),

	statusChanged: function() {
		Ember.$.each(Ember.View.views, function() {
			if (this.get('templateName') === 'sidebar') {
				this.rerender();
			}
		});
		// XXX - i don't really like this but hey it works, I'll come back to it at some
		// point in the future and see if theres a better way
	}.observes('networks.@each.internal'),
	
	sortProperties: ['url'],
	sortAscending: true,

	ready: function() {
		this.set('networks', this.socket.findAll('networks'));
		this.set('content', this.socket.findAll('tabs'));
		this.set('events', this.socket.findAll('events'));
		// set that to the tabs collection, it'll update automatically when they change
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