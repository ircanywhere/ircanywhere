App.NetworkController = Ember.ObjectController.extend({
	needs: ['index'],

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

		var target = (tab.type === 'network') ? '*' : tab.title,
			events = this.socket.findAll('events', {network: tab.networkName, target: target, unread: true});
		// get the events for the specific tab

		events.setEach('unread', false);
		tab.set('unread', 0);
		// mark them as unread to hide the bar
	}
});