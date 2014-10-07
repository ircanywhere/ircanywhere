App.TitlebarController = Ember.ObjectController.extend({
	needs: ['index', 'network', 'tab'],
	tab: {},

	showMenu: false,
	toggleUsersText: 'Hide Users',
	toggleEventsText: 'Hide Joins/Parts',
	channelLink: 'Leave',
	connectionLink: 'Connect',

	actions: {
		setTopic: function() {
			Ember.$('textarea.command-field:visible').select().val('/topic ');
		},

		toggleUsers: function() {
			var tab = this.get('socket.tabs').findBy('selected', true);

			if (!tab) {
				return;
			}

			this.socket.send('updateTab', tab.get('_id'), {hiddenUsers: !tab.get('hiddenUsers')});
			// update & close the menu
		},

		toggleMobileChannels: function() {
			Ember.$('.tab.selected').removeClass('mobileSidebar');
			Ember.$('.main-view').toggleClass('mobileChannels');
		},

		toggleMobileSidebar: function() {
			Ember.$('.tab.selected').toggleClass('mobileSidebar');
			Ember.$('.main-view').removeClass('mobileChannels');
		},

		toggleEvents: function() {
			var tab = this.get('socket.tabs').findBy('selected', true);

			if (!tab) {
				return;
			}

			this.socket.send('updateTab', tab.get('_id'), {hiddenEvents: !tab.get('hiddenEvents')});
			// update & close the menu
		},

		toggleCycle: function() {
			var tab = this.get('socket.tabs').findBy('selected', true);

			if (!tab) {
				return;
			}

			this.socket.send('execCommand', {
				command: (tab.active) ? '/leave' : '/join',
				network: tab.network,
				target: tab.target
			});
		},

		toggleConnect: function() {
			var tab = this.get('socket.tabs').findBy('selected', true);
			
			if (!tab) {
				return;
			}

			var network = this.get('socket.networks').findBy('_id', tab.get('network'));

			this.socket.send('execCommand', {
				command: (network.internal.status === 'disconnected' || network.internal.status === 'closed' || network.internal.status === 'failed') ? '/reconnect' : '/disconnect',
				network: tab.network,
				target: tab.target
			});
		},

		closeWindow: function() {
			var tab = this.get('socket.tabs').findBy('selected', true);

			if (!tab) {
				return;
			}

			this.socket.send('execCommand', {
				command: '/close',
				network: tab.network,
				target: tab.target
			});
		},

		toggleProperty: function() {
			this.toggleProperty('showMenu');
		}
	},

	_formatTab: function(tab) {
		if (tab.type === 'network') {
			return {
				key: tab.get('_id'),
				type: tab.get('type'),
				title: tab.get('title'),
				modes: '',
				desc: tab.get('url'),
				network: tab.get('networkName'),
				networkId: tab.get('network'),
				isChannel: false
			};
		} else if (tab.type === 'query') {
			return {
				key: tab.get('_id'),
				type: tab.get('type'),
				title: tab.get('title'),
				modes: '',
				desc: tab.get('networkName'),
				network: tab.get('networkName'),
				networkId: tab.get('network'),
				isChannel: false
			};
		} else if (tab.type === 'channel') {
			return {
				key: tab.get('_id'),
				type: tab.get('type'),
				title: tab.get('title'),
				modes: (tab.get('modes')) ? '+' + tab.get('modes') : '',
				desc: (tab.get('topic')) ? tab.get('topic').topic : '',
				network: tab.get('networkName'),
				networkId: tab.get('network'),
				isChannel: true
			};
		}
	},

	tabChanged: function() {
		var tab = this.get('socket.tabs').findBy('_id', this.get('controllers.index.tabId'));
		// get the selected tab

		if (tab) {
			this.set('tab', this._formatTab(tab));
		}
		// update this.tab if we have a new selected tab
	}.observes('controllers.index.tabId'),

	optionsChanged: function() {
		var tab = this.get('socket.tabs').findBy('_id', this.get('controllers.index.tabId')),
			id = (tab) ? tab.get('network') : false,
			network = this.get('socket.networks').findBy('_id', id);
		// get the selected tab

		if (!tab) {
			return false;
		} 

		if (tab.get('hiddenUsers')) {
			this.set('toggleUsersText', 'Show Users');
		} else {
			this.set('toggleUsersText', 'Hide Users');
		}
		// the hidden users option has changed

		if (tab.get('hiddenEvents')) {
			this.set('toggleEventsText', 'Show Joins/Parts');
		} else {
			this.set('toggleEventsText', 'Hide Joins/Parts');
		}
		// the hidden events option has changed

		if (tab.get('active')) {
			this.set('channelLink', 'Leave');
		} else {
			this.set('channelLink', 'Join');
		}
		// tab activity has changed

		if (network.internal.status === 'disconnected' || network.internal.status === 'closed' || network.internal.status === 'failed') {
			this.set('connectionLink', 'Connect');
		} else {
			this.set('connectionLink', 'Disconnect');
		}
		// is the network connected?
	}.observes('socket.tabs.@each.hiddenUsers', 'socket.tabs.@each.hiddenEvents', 'socket.tabs.@each.active', 'socket.networks.@each.internal.status', 'controllers.index.tabId'),

	ready: function() {
		this.tabChanged();
		this.optionsChanged();
	}
});

App.injectController('titlebar');