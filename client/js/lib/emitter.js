Ember.Emitter = Ember.Object.extend(Ember.Evented, {
	_getController: Ember.K,

	setup: function(getController, controllers, eventMap) {
		var self = this;
			self._getController = getController;

		for (var evt in eventMap) {
			var fn = eventMap[evt];
			
			controllers.forEach(function(controllerName) {
				var controller = self._getController(controllerName);
				// fetch the controller if it's valid.

				if (controller && typeof controller[fn] === 'function') {
					self.on(evt, controller[fn].bind(controller));
				}
			});
		}
	},

	determineEvent: function(collection, type, object) {
		if (this[type + '_' + collection]) {
			this[type + '_' + collection](object);
		}
	},

	new_events: function(object) {
		switch (object.type) {
			case 'privmsg':
				this.trigger('privmsg', object);
				break;
			default:
				break;
			// at the moment we're only bothered about privmsgs
		}
	}
});