App.TitlebarController = Ember.ObjectController.extend({
	needs: ['tab', 'network'],
	tabs: [],
	tab: {},

	showMenu: false,
	toggleUsersText: 'Hide Users',
	toggleEventsText: 'Hide Joins/Parts',
	channelLink: 'Leave',
	connectionLink: 'Connect',

	actions: {
		setTopic: function() {

		},

		toggleUsers: function() {
			var tab = this.get('tabs').filterProperty('selected', true)[0],
				attribute = tab.get('hiddenUsers');

			this.socket.update('tabs', {_id: tab.get('_id')}, {hiddenUsers: !attribute});
			this.set('showMenu', false);
			// update & close the menu
		},

		toggleEvents: function() {
			var tab = this.get('tabs').filterProperty('selected', true)[0],
				attribute = tab.get('hiddenEvents');

			this.socket.update('tabs', {_id: tab.get('_id')}, {hiddenEvents: !attribute});
			this.set('showMenu', false);
			// update & close the menu
		},

		toggleCycle: function() {

		},

		toggleConnect: function() {

		},

		toggleProperty: function() {
			this.toggleProperty('showMenu');
		}
	},

	_formatTab: function(tab) {
		if (tab.type === 'network') {
			return {
				key: tab.get('_id'),
				title: tab.get('target'),
				modes: '',
				desc: tab.get('url'),
				network: tab.get('networkName'),
				isChannel: false
			};
		} else if (tab.type == 'query') {
			return {
				key: tab.get('_id'),
				title: tab.get('target'),
				modes: '',
				desc: '',
				network: tab.get('networkName'),
				isChannel: false
			};
		} else if (tab.type == 'channel') {
			return {
				key: tab.get('_id'),
				title: tab.get('target'),
				modes: '+' + tab.get('modes'),
				desc: (tab.get('topic')) ? tab.get('topic').topic : '',
				network: tab.get('networkName'),
				isChannel: true
			};
		}
	},

	tabChanged: function() {
		var tab = this.get('tabs').filterProperty('selected', true);
		// get the selected tab

		if (tab.length > 0) {
			this.set('tab', this._formatTab(tab[0]));
		}
		// update this.tab if we have a new selected tab
	}.observes('tabs.@each.selected'),

	optionsChanged: function() {
		var tab = this.get('tabs').filterProperty('selected', true)[0];
		// get the selected tab

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
	}.observes('tabs.@each.hiddenUsers', 'tabs.@each.hiddenEvents'),

	ready: function() {
		this.set('tabs', this.socket.findAll('tabs'));
		// load the tabs into this controller so we can define what we're gonna do
		// with them
	}
});