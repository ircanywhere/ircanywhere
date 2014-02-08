App.TitlebarController = Ember.ObjectController.extend({
	needs: ['index', 'network', 'tab'],
	networks: [],
	tabs: [],
	tab: {},

	showMenu: false,
	toggleUsersText: 'Hide Users',
	toggleEventsText: 'Hide Joins/Parts',
	channelLink: 'Leave',
	connectionLink: 'Connect',

	actions: {
		setTopic: function() {
			Ember.$('input.command-field:visible').val('/topic ').focus();
		},

		toggleUsers: function() {
			var tab = this.socket.findOne('tabs', {selected: true}),
				attribute = tab.get('hiddenUsers');

			this.socket.update('tabs', {_id: tab.get('_id')}, {hiddenUsers: !attribute});
			this.set('showMenu', false);
			// update & close the menu
		},

		toggleEvents: function() {
			var tab = this.socket.findOne('tabs', {selected: true}),
				attribute = tab.get('hiddenEvents');

			this.socket.update('tabs', {_id: tab.get('_id')}, {hiddenEvents: !attribute});
			this.set('showMenu', false);
			// update & close the menu
		},

		toggleCycle: function() {
			var tab = this.socket.findOne('tabs', {selected: true});

			this.socket.insert('commands', {
				command: (tab.active) ? '/leave' : '/join',
				network: tab.networkName,
				target: tab.target,
				backlog: false
			});
		},

		toggleConnect: function() {
			var tab = this.socket.findOne('tabs', {selected: true}),
				network = this.socket.findOne('networks', {_id: tab.get('network')});
				
			this.socket.insert('commands', {
				command: (network.internal.status === 'disconnected' || network.internal.status === 'closed' || network.internal.status === 'failed') ? '/reconnect' : '/disconnect',
				network: tab.networkName,
				target: tab.target,
				backlog: false
			});
		},

		closeWindow: function() {
			var tab = this.socket.findOne('tabs', {selected: true});

			this.socket.insert('commands', {
				command: '/close',
				network: tab.networkName,
				target: tab.target,
				backlog: false
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
		var tab = this.socket.findOne('tabs', {_id: this.get('controllers.index.tabId')});
		// get the selected tab

		if (tab) {
			this.set('tab', this._formatTab(tab));
		} else {
			window.history.back();
		}
		// update this.tab if we have a new selected tab
	}.observes('controllers.index.tabId', 'tabs.@each.selected'),

	optionsChanged: function() {
		var tab = this.socket.findOne('tabs', {_id: this.get('controllers.index.tabId')}),
			id = (tab) ? tab.get('network') : false,
			network = this.socket.findOne('networks', {_id: id});
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
	}.observes('tabs.@each.hiddenUsers', 'tabs.@each.hiddenEvents', 'tabs.@each.active', 'networks.@each.internal.status', 'controllers.index.tabId', 'tabs.@each.selected'),

	ready: function() {
		this.set('networks', this.socket.findAll('networks'));
		this.set('tabs', this.socket.findAll('tabs'));
		// load the tabs into this controller so we can define what we're gonna do
		// with them
	}
});