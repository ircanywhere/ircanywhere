App.IndexController = Ember.ObjectController.extend({
	ready: function() {
		var selectedTab = this.socket.find('tabs', {selected: true})[0];

		if (selectedTab !== false) {
			if (selectedTab.type === 'network') {
				this.transitionToRoute('tab', selectedTab.url + '/');
			} else {
				this.transitionToRoute('tab', selectedTab.url);
			}
		}
	}
});