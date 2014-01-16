DS.SocketAdapter = DS.RESTAdapter.extend({
	socket: null,

	init: function() {
		this._super();
		// call the super constructor

		this.set('user', new Ember.Set());
		this.set('networks', new Ember.Set());
		this.set('tabs', new Ember.Set());
		this.set('channelUsers', new Ember.Set());
		// setup the collections

		this.socket = io.connect();
		// connect

		this.socket.on('error', this._error.bind(this));
		this.socket.on('connect', this._listen.bind(this));
		// bind events
	},

	_error: function() {
		this.socket = null;
	},

	_listen: function() {
		var self = this;

		this.socket.on('user', function(data) {
			self._store('users', data);
		});

		this.socket.on('networks', function(data) {
			self._store('networks', data);
		});

		this.socket.on('tabs', function(data) {
			data.forEach(function(payload) {
				if (payload.users.length > 0) {
					self._store('channelUsers', payload.users);
				}

				delete payload.users;
				// remove it so it's not stored in the tab map

				self._store('tabs', [payload]);
			});
		});

		this.findQuery(null, 'events', {type: 'join'}).then(function(data) {
			console.log(data);
		});
		// handle our events individually
		// for sake of ease - like meteor, however we can get collection records in bulk
		// there is an event for each collection apart from channelUsers, along with 3 additional events
		// that indicate whether to insert/update/remove a record from one of the collections
	},

	_store: function(collection, payload) {
		for (var i in payload) {
			if (!payload.hasOwnProperty(i)) {
				continue;
			}

			var item = payload[i];
			if (item._id) {
				this.get(collection).add(item);
			}
		}
	},

	_search: function(query, obj) {
		for (var key in query) {
			if ((key in obj && query[key] == obj[key]) === false) {
				return false;
			}
		}
		return true;
	},

	_find: function(many, store, type, query) {
		var self = this,
			collection = this.get(type);

		return new Ember.RSVP.Promise(function(resolve, reject) {
			if (!collection) {
				return reject('invalid collection');
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
				resolve(set);
			} else {
				reject('not found');
			}
		});
	},

	_send: function(event, payload, callback) {
		if (callback) {
			this.socket.emit(event, payload, callback);
		} else {
			this.socket.emit(event, payload);
		}
	},

	find: function(store, type, query) {
		return this._find(false, store, type, query);
	},

	findMany: function(store, type, query) {
		return this._find(true, store, type, query);
	},

	findAll: function(store, type) {
		return this._find(true, store, type, {});
	},

	findQuery: function(store, type, query) {
		var self = this;

		return new Ember.RSVP.Promise(function(resolve, reject) {
			self._send(type, query, function(response) {
				if (response.length > 0) {
					resolve(response);
				} else {
					reject('not found');
				}
			});
		});
		// this is used to request way back records
		// think messages that are a day old, we probably didn't get them in
		// the sync event so they won't be in our data store, so we make a query
		// which will request them, and return a promise.
	}
});