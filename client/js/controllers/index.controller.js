App.IndexController = Ember.ObjectController.extend(App.Visibility, {
	needs: ['infolist'],
	tabId: null,

	init: function() {
		this.bindVisibility();
	},

	tabChanged: function() {
		var user = this.get('socket.users').objectAt(0),
			tab = this.get('socket.tabs').findBy('url', user.selectedTab);

		if (tab) {
			var url = tab.get('url').split('/');

			if (tab.get('type') === 'network') {
				this.transitionToRoute('network', url[0]);
			} else {
				this.transitionToRoute('tab', url[0], Helpers.encodeChannel(url[1]));
			}
			// move the route to the selected tab

			this.set('tabId', tab.get('_id'));
			// change the tab id
		}
	}.observes('socket.users.@each.selectedTab', 'socket.tabs.length'),
	
	determinePath: function() {
		if (this.socket.authed === null) {
			this.socket.connect();
		} else if (this.socket.authed === false) {
			this.transitionToRoute('login');
		}
	},

	waitTillReady: function() {
		if (this.get('socket.networks.length') === 0 || this.get('socket.tabs.length') === 0) {
			this.socket.set('_empty', true);
			this.transitionToRoute('nonetworks');
		}
	}.observes('socket.done'),

	isAuthed: function() {
		if (this.socket.authed === false) {
			this.transitionToRoute('login');
		}
	}.observes('socket.authed'),

	ready: function() {
		this.tabChanged();
	},

	onBanList: function(data) {
		this.send('openModal', 'infolist');
		this.controllerFor('infolist').populateData(data);
	}
});