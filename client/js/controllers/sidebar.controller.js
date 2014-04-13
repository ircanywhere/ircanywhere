App.SidebarController = Ember.ArrayController.extend(App.Notification, {
	statusChanged: function() {
		Ember.$.each(Ember.View.views, function() {
			if (this.get('templateName') === 'sidebar') {
				this.rerender();
			}
		});
		// XXX - i don't really like this but hey it works, I'll come back to it at some
		// point in the future and see if theres a better way
	}.observes('socket.networks.@each.internal'),
	
	increment: false,
	sortProperties: ['url'],
	sortAscending: true,

	ready: function() {
		this.set('increment', true);
		this.set('user', this.get('socket.users')[0]);
		this.set('content', this.get('socket.tabs'));
		// set that to the tabs collection, it'll update automatically when they change
	},

	newTabMessage: function(object, backlog) {
		var self = this;

		this.get('socket.tabs').forEach(function(tab) {
			var network = self.get('socket.networks').findBy('_id', tab.network);

			if (tab.type === 'channel' && object.target === tab.target) {
				self.incrementCounters(network, tab, object, backlog);
			} else if (tab.type === 'query' && (object.target === tab.target || (object.target === network.nick && object.message.nickname.toLowerCase() === tab.target))) {
				self.incrementCounters(network, tab, object, backlog);
			} else if (tab.type === 'network' && object.target === '*') {
				self.incrementCounters(network, tab, object, backlog);
			}
		});
		// we need to dig a little deeper to find out the exact tab this message is in
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

	onRemovedTab: function(object) {
		window.history.back();
	},

	_updateQuery: function(object) {
		var network = this.get('socket.networks').findBy('_id', object.get('network'));

		if (object.type === 'network') {
			var query = {network: object.networkName, target: '*'};
		} else if (object.type === 'query') {
			var query = {network: object.networkName, $or: [{target: object.target}, {'message.nickname': object.target, target: network.nick}]};
		} else if (object.type === 'channel') {
			var query = {network: object.networkName, target: object.target};
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