App.NetworkController = Ember.ObjectController.extend({
	needs: ['index', 'messages'],
	
	unreadBar: false,

	tabChanged: function() {
		var tab = this.get('socket.tabs').findBy('_id', this.get('controllers.index.tabId'));
		// get the selected tab

		if (tab) {
			var network = this.get('socket.networks').findBy('_id', tab.get('network'));

			delete tab.selectedTab;
			// delete this because it'll cause a circular reference

			network.set('selectedTab', tab);
			this.set('content', network);
			// set content.selectedTab (network) - so we can find the full selected tab object in
			// the network's object for quick access

			Ember.$('.main-view').removeClass('mobileChannels');
		}
		// update this.tab if we have a new selected tab
	}.observes('controllers.index.tabId'),

	markAllAsRead: function(id) {
		var tab = this.get('socket.tabs').findBy('_id', id);

		if (!tab) {
			return false;
		}
		// some how this has happened, but lets be safe and not continue anyway

		var query = Ember.copy(tab.query),
			events = this.get('controllers.messages.content').filterProperty('read', false);
		// get the events for the specific tab

		query.read = false;
		events.setEach('unread', false);
		tab.set('unread', 0);
		tab.set('highlights', 0);
		tab.set('showMessageBar', false);
		// mark them as unread to hide the bar

		this.socket.send('readEvents', query, {read: true});
		// update the records
	},

	gotoUnread: function() {
		var first = this.get('controllers.messages.content').filterProperty('read', false).objectAt(0),
			tabElement = Ember.$('#tab-' + this.get('controllers.index.tabId') + ' .backlog');

		if (first) {
			var firstElement = tabElement.find('[data-id=' + first._id + ']')[0];
			if (firstElement) {
				tabElement[0].scrollTop = firstElement.offsetTop - firstElement.offsetHeight;
			}
		} else {
			tabElement[0].scrollTop = 0;
		}
		// XXX - Work on this.. A bit iffy
	},

	gotoHighlight: function() {
		// XXX
	},

	onUnreadChange: function() {
		var tabs = this.get('socket.tabs'),
			selectedTab = tabs.findBy('_id', this.get('controllers.index.tabId')),
			title = (selectedTab) ? [selectedTab.get('title'), '-', App.get('defaultTitle')] : [App.get('defaultTitle')],
			unread = 0,
			highlights = 0,
			route = App.__container__.cache.dict['route:network'];
		// this will probably make Ember people mad but it works and I dunno how to get to the router from here
		// maybe the update title function shouldn't be in the router? huh?.. idk

		tabs.forEach(function(tab) {
			unread += tab.unread;
			highlights += tab.highlights;
		});
		
		if (unread > 0) {
			title.unshift('*');
		} else if (title[0] === '*') {
			title.shift();
		}

		if (highlights > 0) {
			title.unshift('(' + highlights + ')');
		} else if (title[0][0] === '(') {
			title.shift();
		}

		if (route) {
			route.updateTitle(title.join(' '));
		}
	}.observes('socket.tabs.@each.unread', 'socket.tabs.@each.highlights'),

	ready: function() {
		this.tabChanged();
	}
});

App.injectController('network');