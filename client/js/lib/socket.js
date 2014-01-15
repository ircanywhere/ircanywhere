/**
 * @module ES
 * @subModule Module
 */
Ember.Socket = Ember.ObjectController.extend({
	/**
	 * @property controllers
	 * @type {Array}
	 * List of controllers for which the events can be emitted to.
	 * @default []
	 */
	controllers: [],

	/**
	 * @property socket {Object}
	 * @type {Object}
	 */
	socket: null,

	/**
	 * @constructor
	 * Responsible for establishing a connect to the Socket.io server.
	 */
	init: function() {
		// connect to the socket server
		var socket = io.connect();

		socket.on('error', function socketError() {
			// Throw an exception if an error occurs.
			throw 'Unable to make a connection to the Socket.io server!';
		});

		// Store a reference to the socket.
		this.set('socket', socket);

		/**
		 * @on connect
		 */
		socket.on('connect', this._listen.bind(this));

	},

	/**
	 * @method emit
	 * @param eventName {String}
	 * @param params {Array}
	 * Responsible for emitting an event to the waiting Socket.io server.
	 * @return {void}
	 */
	emit: function(eventName, params) {
		var args = Array.prototype.slice.call(arguments),
			scope = Ember.get(this, 'socket');

		scope.emit.apply(scope, args);
	},

	/**
	 * @method _listen
	 * Responsible for listening to events from Socket.io, and updating controller properties that
	 * subscribe to those events.
	 * @return {void}
	 * @private
	 */
	_listen: function() {
		var controllers = Ember.get(this, 'controllers'),
			getController = this._getController.bind(this),
			events = [],
			module = this,
			respond = function respond() {
				var eventData = Array.prototype.slice.call(arguments);
				module._update.call(module, this, eventData);
			};

		Ember.EnumerableUtils.forEach(controllers, function controllerIteration(controllerName) {
			// Fetch the controller if it's valid.
			var controller = getController(controllerName),
				eventNames = controller.events;

			if (controller) {
				// Invoke the `connect` method if it has been defined on this controller.
				if (typeof controller.events === 'object' && typeof controller.events.connect === 'function') {
					controller.events.connect.apply(controller);
				}

				// Iterate over each event defined in the controller's `sockets` hash, so that we can
				// keep an eye open for them.
				for (var eventName in eventNames) {
					if (eventNames.hasOwnProperty(eventName)) {
						if (events.indexOf(eventName) !== -1) {
							// Don't observe this event if we're already observing it.
							continue;
						}

						// Push the event so we don't listen for it twice.
						events.push(eventName);

						// ...And finally we can register the event to listen for it.
						Ember.get(module, 'socket').on(eventName, respond.bind(eventName));
					}
				}
			}
		});
	},

	/**
	 * @method _update
	 * @param eventName {String}
	 * @param eventData {String|Number|Object}
	 * @return {Number} Number of controllers which responded to the event.
	 * @private
	 */
	_update: function _update(eventName, eventData) {
		var controllers = Ember.get(this, 'controllers'),
			respondingControllers = 0,
			getController = this._getController.bind(this);

		Ember.run(function() {
			// Iterate over each listener controller and emit the event we caught.
			Ember.EnumerableUtils.forEach(controllers, function(controllerName) {
				// Fetch the controller if it's valid.
				var controller = getController(controllerName);

				if (controller) {
					// Attempt to find a match for the current event name.
					var correspondingAction = controller.events[eventName];

					if (!correspondingAction) {
						// If we can't find it, then we can't go any further for this controller.
						return;
					}

					if (typeof correspondingAction === 'function') {
						// We need to invoke the function to respond to the event because the coder
						// has specified a callback instead of a property to update.
						correspondingAction.apply(controller, eventData);
						respondingControllers++;
						return;
					}

					// Determine if the property is specifying multiple properties to update.
					if (Ember.isArray(correspondingAction)) {
						Ember.EnumerableUtils.forEach(correspondingAction, function propertyIteration(property, index) {
							// Update each property included in the array of properties.
							Ember.set(controller, property, eventData[index]);
						});

						respondingControllers++;
						return;
					}

					// Otherwise it's a single property to update.
					Ember.set(controller, correspondingAction, eventData);
					respondingControllers++;
				}
			});
		});

		return respondingControllers;
	},

	/**
	 * @method _getController
	 * @param name {String}
	 * Responsible for retrieving a controller if it exists, and if it has defined a `events` hash.
	 * @return {Object|Boolean}
	 * @private
	 */
	_getController: function _getController(name) {
		// Format the `name` to match what the lookup container is expecting, and then
		// we'll locate the controller from the `container`.
		name = 'controller:%@'.fmt(name);
		var controller = this.container.lookup(name);

		if (!controller || ('events' in controller === false)) {
			// Don't do anything with this controller if it hasn't defined a `events` hash.
			return false;
		}

		return controller;
	}
});

/**
 * @onLoad Ember.Application
 * @param $app {Object}
 */
Ember.onLoad('Ember.Application', function($app) {
	$app.initializer({
		/**
		 * @property name
		 * @type {String}
		 * @default 'sockets'
		 */
		name: 'sockets',

		/**
		 * @method initialize
		 * @param container {Object}
		 * @param application {Object}
		 * @return {void}
		 */
		initialize: function(container, application) {
			// Register `socket:main` with Ember.js.
			application.register('socket:main', application.Socket, {
				singleton: true
			});

			// We then want to inject `socket` into each controller.
			application.inject('controller', 'socket', 'socket:main');
		}
	});
});