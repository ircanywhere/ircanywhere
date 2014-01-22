App.IndexController = Ember.ObjectController.extend({
	ready: function() {
		var selectedTab = this.socket.find('tabs', {selected: true})[0],
			url = selectedTab.get('url').split('/');

		if (selectedTab.get('type') === 'network') {
			this.transitionToRoute('network', url[0]);
		} else {
			this.transitionToRoute('tab', url[0], encodeURIComponent(url[1]));
		}
	}
});