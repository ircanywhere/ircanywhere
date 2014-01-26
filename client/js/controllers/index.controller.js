App.IndexController = Ember.ObjectController.extend({
	tabId: null,
	
	ready: function() {
		var selectedTab = this.socket.findOne('tabs', {selected: true}),
			url = selectedTab.get('url').split('/');

		if (selectedTab.get('type') === 'network') {
			this.transitionToRoute('network', url[0]);
		} else {
			this.transitionToRoute('tab', url[0], encodeURIComponent(url[1]));
		}

		this.set('tabId', selectedTab.get('_id'));
	}
});