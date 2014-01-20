Ember.SocketEmitter = Ember.Object.extend(Ember.Evented, {
	done: function() {
		this.trigger('done');
	}
});

Ember.Socket = Ember.Object.extend({
	controllers: [],

	socket: null,
	done: false,

	emitter: Ember.SocketEmitter.create(),

	init: function() {
		this.set('users', Ember.A());
		this.set('networks', Ember.A());
		this.set('tabs', Ember.A());
		this.set('channelUsers', Ember.A());
		this.set('events', Ember.A());
		// setup the collections

		this.connect();
	},

	connect: function() {
		var self = this,
			socket = io.connect(),
			existing = this.get('socket');
		// connect

		if (existing) {
			existing.socket.connecting = false;
			existing.socket.connect();
		}
		// socket exists

		socket.on('error', function(err) {
			self._getController('index').transitionToRoute('login');
		});

		socket.on('connect', function() {
			self._listen();
		});
		// bind events

		this.set('socket', socket);
	},

	_listen: function() {
		var controllers = Ember.get(this, 'controllers'),
			getController = this._getController.bind(this),
			self = this,
			respond = function() {
				var eventData = Array.prototype.slice.call(arguments);
				module._update.call(module, this, eventData);
			};

		this.set('done', false);

		this.socket.on('users', function(data) {
			self._store('users', [data]);
		});

		this.socket.on('networks', function(data) {
			self._store('networks', data);
		});

		this.socket.on('tabs', function(data) {
			self._store('tabs', data);
		});

		this.socket.on('channelUsers', function(data) {
			self._store('channelUsers', data, true);
		});

		this.socket.on('insert', function(data) {
			if (!data.collection || !data.record) {
				return false;
			}

			self._store(data.collection, [data.record]);
		});

		this.socket.on('update', function(data) {
			if (!data.collection || !data.id || !data.record) {
				return false;
			}

			self._update(data.collection, data.id, data.record);
		});

		this.socket.on('delete', function(data) {
			if (!data.collection || !data.id) {
				return false;
			}

			self._delete(data.collection, data.id);
		});
		// handle our events individually
		// for sake of ease - like meteor, however we can get collection records in bulk
		// there is an event for each collection apart from channelUsers, along with 3 additional events
		// that indicate whether to insert/update/remove a record from one of the collections

		this.get('emitter').on('done', function() {
			self.set('done', true);

			Ember.EnumerableUtils.forEach(controllers, function(controllerName) {
				var controller = getController(controllerName);
				// fetch the controller if it's valid.

				if (controller) {
					if (typeof controller.ready === 'function') {
						controller.ready.apply(controller);
					}
					// invoke the `ready` method if it has been defined on this controller.
				}
			});
			// bind any connect events to our controllers
		});
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

	_store: function(collection, payload, emit) {
		var emit = (emit) ? emit : false,
			self = this,
			col = self.get(collection),
			count = (payload.length - 1).toString(),
			exists = false,
			object = {};

		for (var i in payload) {
			if (!payload.hasOwnProperty(i)) {
				continue;
			}

			object = Ember.Object.create(payload[i]);
			exists = col.findBy('_id', object.get('_id'));
			
			if (exists) {
				self._update(collection, exists.get('_id'), object);
			} else {
				col.pushObject(object);
			}

			if (emit && i === count) {
				self.get('emitter').done();
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
			return set.toArray();
		} else {
			return false;
		}
	},

	_send: function(event, payload, callback) {
		if (callback) {
			this.socket.emit(event, payload, callback);
		} else {
			this.socket.emit(event, payload);
		}
	},

	findOne: function(type, query) {
		return this._find(false, type, query);
	},

	find: function(type, query) {
		return this._find(true, type, query);
	},

	findButWait: function(type, query) {
		var self = this,
			_getResults = function(resolve, reject) {
				var results = self._find(true, type, query);
				
				if (results) {
					resolve(results);
				} else {
					reject('not found');
				}
			};

		return new Ember.RSVP.Promise(function(resolve, reject) {
			if (self.get('done') === false) {
				self.get('emitter').on('done', function() {
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

		return new Ember.RSVP.Promise(function(resolve, reject) {
			self._send(type, query, function(response) {
				if (response.length > 0) {
					resolve(response);
					self._store(type, response);
				} else {
					reject('not found');
				}
			});
		});
		// this is used to request way back records
		// think messages that are a day old, we probably didn't get them in
		// the sync event so they won't be in our data store, so we make a query
		// which will request them, and return a promise.
	},

	update: function(type, query, update) {
		var self = this,
			payload = {collection: type, query: query, update: update};

		return new Ember.RSVP.Promise(function(resolve, reject) {
			self._send('update', payload, function(response) {
				if (response.length > 0) {
					self._store(type, response);
					// handle so we can insert into db

					resolve(response);
					// also send it back if someone wants to do a straight away
					// handle on the response
				} else {
					reject('not updated');
				}
			});
		});
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