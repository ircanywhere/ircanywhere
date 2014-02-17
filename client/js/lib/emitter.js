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
		removeNetwork: 'onRemovedNetwork'
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

	determineEvent: function(collection, type, object) {
		if (this[type + '_' + collection]) {
			this[type + '_' + collection](object);
		}
	},

	new_tabs: function(object) {
		this.trigger('newTab', object);
	},

	update_tabs: function(object) {
		this.trigger('updatedTab', object);
	},

	delete_tabs: function(object) {
		this.trigger('removedTab', object);
	},

	new_network: function(object) {
		this.trigger('newNetwork', object);
	},

	update_network: function(object) {
		this.trigger('updateNetwork', object);
	},

	delete_network: function(object) {
		this.trigger('deleteNetwork', object);
	},

	new_events: function(object) {
		this.trigger(object.type, object);
		// we can just trigger all our types directly like this
	}
});