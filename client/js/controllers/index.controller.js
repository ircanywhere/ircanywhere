App.IndexController = Ember.ObjectController.extend({
	actions: {},

	events: {
		ready: function() {
			var selectedTab = this.socket.find('tabs', {selected: true})[0];

			if (selectedTab !== false) {
				this.transitionToRoute('tab', selectedTab.url);
			}
		}
	}
});