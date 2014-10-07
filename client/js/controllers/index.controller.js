App.IndexController = Ember.ObjectController.extend(App.Visibility, {
	needs: ['infolist', 'network'],
	tabId: null,
	isActive: true,
	history: [],

	init: function() {
		if (!this.socket.socket || !this.socket.authed) {
			this.socket._loadComplete(true);
		}

		this.bindVisibility();
		this.setupHistory();
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

			tab.set('requestedBacklog', false);
			tab.set('messageLimit', 50);

			this.get('socket.users').setEach('selectedTab', tab.url);
			this.set('tabId', tab.get('_id'));
			this.get('controllers.network').onUnreadChange();
			// change the tab information
		}
	}.observes('socket.users.@each.selectedTab'),
	
	determinePath: function() {
		if (this.socket.authed === null && !this.socket.socket) {
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

	setupHistory: function() {
		var self = this;

		self.history.push(document.location.href);
		window.onpopstate = function() {
			self.history.push(document.location.href);
		};
	},

	ready: function() {
		this.tabChanged();
	},

	onBanList: function(data) {
		this.send('openModal', 'infolist');
		this.controllerFor('infolist').populateData(data);
	},

	onInviteList: function(data) {
		this.send('openModal', 'infolist');
		this.controllerFor('infolist').populateData(data);
	},

	onExceptList: function(data) {
		this.send('openModal', 'infolist');
		this.controllerFor('infolist').populateData(data);
	},

	onQuietList: function(data) {
		this.send('openModal', 'infolist');
		this.controllerFor('infolist').populateData(data);
	},

	onOpenList: function(data) {
		this.send('openModal', 'list');
		this.controllerFor('list').prePopulateData(data);
	},

	onList: function(data) {
		this.send('openModal', 'list');
		this.controllerFor('list').populateData(data);
	},

	onWhois: function(data) {
		this.send('openModal', 'whois');
		this.controllerFor('whois').populateData(data);
	}
});

App.injectController('index');