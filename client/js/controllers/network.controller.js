App.NetworkController = Ember.ObjectController.extend({
	needs: ['index', 'messages'],

	tabChanged: function() {
		var tab = this.socket.findOne('tabs', {_id: this.get('controllers.index.tabId')}),
			content = this.get('content');
		// get the selected tab

		if (!content) {
			content = this.socket.findOne('tabs', {network: tab.get('network')});
		}

		if (tab) {
			delete tab.selectedTab;
			// delete this because it'll cause a circular reference

			content.set('selectedTab', tab);
			this.set('content', content);
			// set content.selectedTab (network) - so we can find the full selected tab object in
			// the network's object for quick access
		}
		// update this.tab if we have a new selected tab
	}.observes('controllers.index.tabId', 'tabs.@each.selected'),

	ready: function() {
		this.tabChanged();
	},

	markAllAsRead: function(id) {
		var tab = this.socket.findOne('tabs', {_id: id});

		if (!tab) {
			return false;
		}
		// some how this has happened, but lets be safe and not continue anyway

		var target = (tab.type === 'network') ? '*' : tab.target,
			events = this.socket.findAll('events', {network: tab.networkName, target: target, unread: true});
		// get the events for the specific tab

		events.setEach('unread', false);
		tab.set('unread', 0);
		// mark them as unread to hide the bar

		this.socket.update('events', {network: tab.networkName, target: target, read: false}, {read: true});
		// update the records
	},

	gotoUnread: function(id) {
		var first = this.get('controllers.messages.sorted').filterProperty('unread', true).objectAt(0),
			tabElement = Ember.$('#tab-' + this.get('controllers.index.tabId') + ' .backlog');

		if (first) {
			var firstElement = tabElement.find('[data-id=' + first._id + ']')[0];
			tabElement[0].scrollTop = firstElement.offsetTop - firstElement.offsetHeight;
		} else {
			tabElement[0].scrollTop = 0;
		}
		// XXX - Work on this.. A bit iffy
	},

	gotoHighlight: function(id) {
		console.log('goto first highlight');
		// XXX
	}
});