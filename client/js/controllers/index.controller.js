App.IndexController = Ember.ObjectController.extend({
	actions: {},

	events: {
		connect: function() {
			var self = this,
				callback = function() {
					var selectedTab = self.socket.find('tabs', {selected: true});

					if (selectedTab !== false) {
						self.transitionToRoute('tab', selectedTab.url);
						console.log(selectedTab.url);
					}
				};

			setTimeout(callback, 100);
		}
	}
});