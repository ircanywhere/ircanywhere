Ember.SocketEmitter = Ember.Object.extend(Ember.Evented, {
	done: function() {
		this.trigger('done');
	}
});

Ember.Socket = Ember.Object.extend({
	controllers: [],

	socket: null,
	done: false,
	authed: null,

	emitter: Ember.SocketEmitter.create(),

	init: function() {
		this.set('users', Ember.A());
		this.set('networks', Ember.A());
		this.set('tabs', Ember.A());
		this.set('channelUsers', Ember.A());
		this.set('events', Ember.A());
		this.set('commands', Ember.A());
		// setup the collections

		this.connect();
	},

	connect: function() {
		var self = this,
			socket = new SockJS('/websocket'),
			existing = this.socket;
		// connect

		if (existing) {
			socket = new SockJS('/websocket');
		}
		// socket exists

		socket.onclose = function() {
			// XXX - Handle reconnect
		}

		socket.onopen = function() {
			self._setup();
		}

		socket.onmessage = function(message) {
			self._listen(JSON.parse(message.data));
		}
		// bind events

		this.set('socket', socket);
	},

	_setup: function() {
		var controllers = Ember.get(this, 'controllers'),
			getController = this._getController.bind(this),
			self = this,
			respond = function() {
				var eventData = Array.prototype.slice.call(arguments);
				module._update.call(module, this, eventData);
			};

		this.set('done', false);

		this.emitter.on('done', function() {
			self.set('done', true);

			Ember.EnumerableUtils.forEach(controllers, function(controllerName) {
				var controller = getController(controllerName);
				// fetch the controller if it's valid.

				if (controller && typeof controller.ready === 'function') {
					controller.ready.apply(controller);
				}
				// invoke the `ready` method if it has been defined on this controller.
			});
			// bind any connect events to our controllers
		});

		this._send('authenticate', document.cookie);
		// authenticate
	},

	_listen: function(incoming) {
		var self = this,
			event = incoming.event,
			data = incoming.data;

		if (event === 'authenticate') {
			self.set('authed', data);
		}

		if (event === 'burst') {
			Ember.$.get(data.url, function(data) {
				for (var type in data) {
					if (type === 'burstend' && data[type] === true) {
						self.emitter.done();
					} else {
						self._store(type, data[type]);
					}
				}
			});
		}

		if (event === 'events') {
			self._store('events', data);
		}

		if (event === 'insert') {
			if (!data.collection || !data.record) {
				return false;
			}

			self._store(data.collection, [data.record]);
		}

		if (event === 'update') {
			if (!data.collection || !data.id || !data.record) {
				return false;
			}

			self._update(data.collection, data.id, data.record);
		}

		if (event === 'delete') {
			if (!data.collection || !data.id) {
				return false;
			}

			self._delete(data.collection, data.id);
		}
		// handle our events individually
		// for sake of ease - like meteor, however we can get collection records in bulk
		// there is an event for each collection apart from channelUsers, along with 3 additional events
		// that indicate whether to insert/update/remove a record from one of the collections
	},

	_getController: function(name) {
		name = 'controller:%@'.fmt(name);
		var controller = this.container.lookup(name);
		// format the `name` to match what the lookup container is expecting, and then
		// we'll locate the controller from the `container`.

		if (!controller || ('ready' in controller === false)) {
			return false;
		}
		// don't do anything with this controller if it hasn't defined a `events` hash.

		return controller;
	},

	_store: function(collection, payload) {
		var self = this,
			col = self.get(collection),
			exists = false,
			object = {};

		for (var k = 0, len = payload.length; k < len; k++) {
			var i = payload[k];

			object = Ember.Object.create(i);
			exists = col.findBy('_id', object.get('_id'));
			
			if (exists) {
				self._update(collection, exists.get('_id'), object);
			} else {
				col.pushObject(object);
			}
		}
	},

	_update: function(type, id, changes) {
		var self = this,
			collection = this.get(type);
		
		if (!collection) {
			return false;
		}

		var object = collection.findProperty('_id', id);
		// find the object

		if (!object) {
			return false;
		}
		// object doesnt even exist? :/

		object.setProperties(changes);
		// overwrite them in the set
	},

	_delete: function(type, id) {
		var self = this,
			collection = this.get(type);
		
		if (!collection) {
			return false;
		}

		var object = collection.findProperty('_id', id);
		// find the object

		collection.removeObject(object);
		// bump it out
	},

	_search: function(query, obj) {
		for (var key in query) {
			if ((key in obj && query[key] === obj[key]) === false) {
				return false;
			}
		}
		return true;
	},

	_find: function(many, type, query) {
		var self = this,
			collection = this.get(type);
		
		if (!collection) {
			return false;
		}

		if (many) {
			var set = collection.filter(function(obj) {
				return self._search(query, obj);
			});
		} else {
			var set = collection.find(function(obj) {
				return self._search(query, obj);
			});
		}
		// attempt to find

		if (set) {
			return (many) ? set.toArray() : set;
		} else {
			return false;
		}
	},

	_send: function(event, payload) {
		this.socket.send(JSON.stringify({event: event, data: payload}));
	},

	findOne: function(type, query) {
		return this._find(false, type, query);
	},

	find: function(type, query) {
		return this._find(true, type, query);
	},

	findButWait: function(type, query, one) {
		var one = one || false,
			self = this,
			_getResults = function(resolve, reject) {
				var results = self._find(true, type, query);
				
				if (results) {
					results = (one) ? results[0] : results;
					resolve(results);
				} else {
					reject('not found');
				}
			};

		return new Ember.RSVP.Promise(function(resolve, reject) {
			if (self.get('done') === false) {
				self.emitter.on('done', function() {
					_getResults(resolve, reject);
				});
				// wait till we've done inserting results
			} else {
				_getResults(resolve, reject);
			}
		});
	},

	findAll: function(type) {
		var collection = this.get(type);
		
		if (!collection) {
			return false;
		}

		return collection;
	},

	request: function(type, query) {
		var self = this;

		self._send(type, query);
	},

	insert: function(type, insert) {
		var self = this,
			payload = {collection: type, insert: insert};

		self._send('insert', payload);
	},

	update: function(type, query, update) {
		var self = this,
			payload = {collection: type, query: query, update: update};

		self._send('update', payload);
	}
});

Ember.onLoad('Ember.Application', function($app) {
	$app.initializer({
		name: 'sockets',

		initialize: function(container, application) {
			application.register('socket:main', application.Socket, {
				singleton: true
			});
			// register `socket:main` with Ember.js.

			application.inject('controller', 'socket', 'socket:main');
			// we then want to inject `socket` into each controller.
		}
	});
});