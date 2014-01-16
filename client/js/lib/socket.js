DS.SocketAdapter = DS.Adapter.extend({
	socket: null,

	init: function() {
		this._super();

		this.socket = io.connect();
		// connect

		this.socket.on('connect', this._error.bind(this));
		this.socket.on('connect', this._listen.bind(this));
	},

	_error: function() {

	},

	_listen: function() {
		var self = this;

		this.socket.on('sync', function(data) {
			if (data.user) {
				self.set('user', data.user);
			}

			if (data.networks) {
				data.networks.forEach(function(payload) {
					self._store('networks', payload);
				});
			}

			if (data.tabs) {
				data.tabs.forEach(function(payload) {
					if (payload.users.length > 0) {
						payload.users.forEach(function(user) {
							self._store('channelUsers', user);
						});
					}

					delete payload.users;
					// remove it so it's not stored in the tab map

					self._store('tabs', payload);
				});
			}

			self.find(null, 'networks', {"_id":"52d3fc718132f8486dcde1d0"}).then(function(data) {
				console.log(data);
			});
		});
		// handle our events individually
		// for sake of ease - like meteor, there is 4 possible events
		// sync, create, update, remove
	},

	_store: function(collection, payload) {
		var array = this.get(collection);

		if (!array) {
			this.set(collection, Ember.A());
		}
		
		if (payload._id) {
			this.get(collection).push(payload);
		}
	},

	_search: function(collection, query, obj) {
		for (var key in query) {
			if ((key in obj && query[key] == obj[key]) === false) {
				return false;
			}
		}
		return true;
	},

	find: function(store, type, query) {
		var self = this,
			collection = this.get(type);

		return new Ember.RSVP.Promise(function(resolve, reject) {
			if (!collection) {
				return reject('invalid collection');
			}

			var set = collection.find(function(obj) {
				return self._search(collection, query, obj);
			});
			// attempt to find

			if (set) {
				resolve(set);
			} else {
				reject('not found');
			}
		});
	}
});