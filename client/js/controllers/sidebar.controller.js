App.SidebarController = Ember.ArrayController.extend({
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

	newTabMessage: function(object) {
		var self = this;

		this.get('socket.tabs').forEach(function(tab) {
			var network = self.get('socket.networks').findBy('_id', tab.network);

			if (tab.type === 'channel' && object.target === tab.target) {
				self.incrementCounters(network, tab, object);
			} else if (tab.type === 'query' && (object.target === tab.target || (object.target === network.nick && object.message.nickname.toLowerCase() === tab.target))) {
				self.incrementCounters(network, tab, object);
			} else if (tab.type === 'network' && object.target === '*') {
				self.incrementCounters(network, tab, object);
			}
		});
		// we need to dig a little deeper to find out the exact tab this message is in
	},

	incrementCounters: function(network, tab, object) {
		if (tab && network && (!object.read || object.unread)) {
			object.set('unread', true).set('read', true);

			if (object.extra.highlight && this.increment) {
				tab.incrementProperty('highlights', 1);
			}

			if (this.increment) {
				tab.incrementProperty('unread', 1);
			}
		}
	},

	onNotice: function(object) {
		this.newTabMessage(object);
	},

	onAction: function(object) {
		this.newTabMessage(object);
	},

	onPrivmsg: function(object) {
		this.newTabMessage(object);
	},

	onRemovedTab: function(object) {
		window.history.back();
	}
});