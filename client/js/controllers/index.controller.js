App.IndexController = Ember.ObjectController.extend({
	tabs: [],
	tabId: null,

	tabChanged: function() {
		var tab = this.get('tabs').filterProperty('selected', true)[0];

		if (tab) {
			var url = tab.get('url').split('/');

			if (tab.get('type') === 'network') {
				this.transitionToRoute('network', url[0]);
			} else {
				this.transitionToRoute('tab', url[0], encodeURIComponent(url[1]));
			}
			// move the route to the selected tab

			this.set('tabId', tab.get('_id'));
			// change the tab id
		}
	}.observes('tabs.@each.selected'),
	
	ready: function() {
		this.set('tabs', this.socket.findAll('tabs'));
		// set some variables
	}
});