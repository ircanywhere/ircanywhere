App.SidebarController = Ember.ArrayController.extend(App.Notification, {
	needs: ['index', 'network'],

	increment: false,

	content: function() {
		var selectedTab = this.get('user.selectedTab');

		this.get('socket.tabs').map(function (tab) {
			tab.set('selected', tab.url === selectedTab);
			return tab;
		});

		return this.get('socket.tabs').sortBy('url');
	}.property('user.selectedTab', 'socket.tabs'),

	statusChanged: function() {
		Ember.$.each(Ember.View.views, function() {
			if (this.get('templateName') === 'sidebar') {
				this.rerender();
			}
		});
		// XXX - i don't really like this but hey it works, I'll come back to it at some
		// point in the future and see if theres a better way
	}.observes('socket.networks.@each.internal'),

	ready: function() {
		this.set('increment', true);
		this.set('user', this.get('socket.users')[0]);
		// set that to the tabs collection, it'll update automatically when they change
	},

	newTabMessage: function(object, backlog) {
		var self = this;

		var tabs = this.socket.find('tabs', {network: object.network}),
			network = this.get('socket.networks').findBy('_id', object.network);

		if (!tabs || !network) {
			return;
		}

		tabs.forEach(function(tab) {
			if (tab.type === 'channel' && object.target === tab.target) {
				self.incrementCounters(network, tab, object, backlog);
			} else if (tab.type === 'query' && (Helpers.compareStrings(object.target, tab.target, true) || (Helpers.compareStrings(object.target, network.nick, true) && Helpers.compareStrings(object.message.nickname, tab.target, true)))) {
				self.incrementCounters(network, tab, object, backlog);
			} else if (tab.type === 'network' && object.target === '*') {
				self.incrementCounters(network, tab, object, backlog);
			}
			// we need to dig a little deeper to find out the exact tab this message is in
		});
	},

	incrementCounters: function(network, tab, object, backlog) {
		if (tab && network && (!object.read || object.unread)) {
			if (backlog) {
				return false;
			}

			if (object.extra.highlight && this.increment) {
				tab.incrementProperty('highlights', 1);
			}

			if (this.increment) {
				tab.incrementProperty('unread', 1);
			}
		}
	},

	onNotice: function(object, backlog) {
		this.newTabMessage(object, backlog);
	},

	onAction: function(object, backlog) {
		this.newTabMessage(object, backlog);
	},

	onPrivmsg: function(object, backlog) {
		this.newTabMessage(object, backlog);
	},

	onNewTab: function(object) {
		this._updateQuery(object);

		if (!object.get('highlights')) {
			object.set('highlights', 0);
		}

		if (!object.get('unread')) {
			object.set('unread', 0);
		}

		if (this.get('socket._empty') === true) {
			window.location.hash = '#/t/' + object.url;
			this.socket.set('_empty', false);
		}
	},

	onUpdatedTab: function(object) {
		this._updateQuery(object);
	},

	onRemovedTab: function() {
		var tabHistory = this.get('controllers.index.history'),
			lastItem = tabHistory[tabHistory.length - 3];

		if (lastItem) {
			document.location.href = lastItem;
		} else {
			var tab = this.get('controllers.network.selectedTab');
			
			if (tab) {
				document.location.href = '#/t/' + tab.url.split('/')[0];
			}
		}
	},

	_updateQuery: function(object) {
		var network = this.get('socket.networks').findBy('_id', object.get('network')),
			query;

		if (object.type === 'network') {
			query = {network: object.network, target: '*'};
		} else if (object.type === 'query') {
			query = {network: object.network, $or: [{target: object.target}, {'message.nickname': object.target, target: network.nick}]};
		} else if (object.type === 'channel') {
			query = {network: object.network, target: object.target};
		}

		object.set('query', query);
	},

	actions: {
		onClick: function(url) {
			var tabUrl = Helpers.decodeChannel(url.substr(4)),
				tab = this.get('socket.tabs').findBy('url', tabUrl);

			if (this.needsPermission() && tab && tab.get('highlights') > 0) {
				this.requestPermission();
			}
			// are there any pending unread highlights? if so ask for notification permission

			window.location.href = url;
		}
	}
});

App.injectController('sidebar');
