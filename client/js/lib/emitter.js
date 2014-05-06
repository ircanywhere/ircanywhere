Ember.Emitter = Ember.Object.extend(Ember.Evented, {
	_getController: function(container, name) {
		name = 'controller:%@'.fmt(name);
		var controller = container.lookup(name);
		// format the `name` to match what the lookup container is expecting, and then
		// we'll locate the controller from the `container`.

		if (!controller) {
			return false;
		}

		return controller;
	},

	eventMap: {
		done: 'ready',
		updated: 'updated',
		privmsg: 'onPrivmsg',
		action: 'onAction',
		notice: 'onNotice',
		join: 'onJoin',
		part: 'onPart',
		nick: 'onNick',
		mode: 'onMode',
		usermode: 'onUserMode',
		topic: 'onTopic',
		kick: 'onKick',
		quit: 'onQuit',
		closed: 'onClosed',
		newTab: 'onNewTab',
		updateTab: 'onUpdatedTab',
		removeTab: 'onRemovedTab',
		newNetwork: 'onNewNetwork',
		updateNetwork: 'onUpdatedNetwork',
		removeNetwork: 'onRemovedNetwork',
		burstHighlight: 'onHighlightBurst',
		eventVisible: 'onEventVisible',
		banList: 'onBanList',
		inviteList: 'onInviteList',
		exceptList: 'onExceptList',
		quietList: 'onQuietList',
		openList: 'onOpenList',
		list: 'onList',
		whois: 'onWhois'
	},

	setup: function(container, controllers) {
		var self = this;

		controllers.forEach(function(controllerName) {
			var controller = self._getController(container, controllerName);
			// fetch the controller if it's valid.

			for (var evt in self.eventMap) {
				var fn = self.eventMap[evt];
				if (controller && typeof controller[fn] === 'function') {
					self.off(evt, controller[fn].bind(controller));
					self.on(evt, controller[fn].bind(controller));
				}
			}
		});
	},

	determineEvent: function(collection, type, object, backlog) {
		if (this[type + '_' + collection]) {
			this[type + '_' + collection](object, backlog);
		}
	},

	new_tabs: function(object, backlog) {
		object.set('messageLimit', 50);
		this.trigger('newTab', object, backlog);
	},

	update_tabs: function(object, backlog) {
		this.trigger('updateTab', object, backlog);
	},

	delete_tabs: function(object, backlog) {
		this.trigger('removeTab', object, backlog);
	},

	new_network: function(object, backlog) {
		this.trigger('newNetwork', object, backlog);
	},

	update_network: function(object, backlog) {
		this.trigger('updateNetwork', object, backlog);
	},

	delete_network: function(object, backlog) {
		this.trigger('removeNetwork', object, backlog);
	},

	new_events: function(object, backlog) {
		this.trigger(object.type, object, backlog);
	},

	update_events: function(object, backlog) {
		this.trigger(object.type, object, backlog);
	},

	new_highlights: function(object, backlog) {
		this.trigger('burstHighlight', object, backlog);
	},

	new_banList: function(object, backlog) {
		this.trigger('banList', object, backlog);
	},

	new_inviteList: function(object, backlog) {
		this.trigger('inviteList', object, backlog);
	},

	new_exceptList: function(object, backlog) {
		this.trigger('exceptList', object, backlog);
	},

	new_quietList: function(object, backlog) {
		this.trigger('quietList', object, backlog);
	},

	new_openList: function(object, backlog) {
		this.trigger('openList', object, backlog);
	},

	new_list: function(object, backlog) {
		this.trigger('list', object, backlog);
	},

	new_whois: function(object, backlog) {
		this.trigger('whois', object, backlog);
	}
});