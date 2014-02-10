App.IndexController = Ember.ObjectController.extend(App.Visibility, {
	tabId: null,

	init: function() {
		this.bindVisibility();
	},

	tabChanged: function() {
		var tab = this.get('socket.tabs').findBy('selected', true);

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
	}.observes('socket.tabs.@each.selected'),
	
	determinePath: function() {
		if (this.socket.authed === false) {
			this.transitionToRoute('login');
		}
	}.observes('socket.authed')
});