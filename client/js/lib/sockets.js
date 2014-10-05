Ember.Socket = Ember.Object.extend({
	socket: null,
	done: false,
	authed: null,
	open: false,
	attempts: 1,

	emitter: Ember.Emitter.create(),

	init: function() {
		this.set('users', Ember.A());
		this.set('networks', Ember.A());
		this.set('tabs', Ember.A());
		this.set('channelUsers', Ember.A());
		this.set('events', Ember.A());
		this.set('commands', Ember.A());
		this.set('highlights', Ember.A());
		// setup the collections
	},

	connect: function() {
		var self = this,
			socket = new SockJS('/websocket');
		// connect

		socket.onclose = function() {
			if (!self.authed) {
				return false;
			}

			self._loadComplete(true);

			Ember.run.later(self._flushData.bind(self), 1000);
			// show the popup

			var time = self._generateInterval(self.attempts);
			// generate a time
			
			Ember.run.later(function() {
				self.incrementProperty('attempts');
				self.connect();
			}, time);
			// attempt to reconnect, but back off
		};

		socket.onopen = function() {
			self.set('attempts', 1);
			self._setup();
		};

		socket.onmessage = function(message) {
			self._listen(JSON.parse(message.data));
		};
		// bind events

		this.set('socket', socket);
	},

	_loadComplete: function (complete) {
		if (complete) {
			Ember.$('body div.loading').hide();
		} else {
			Ember.$('body div.loading').show();
		}
	},

	_generateInterval: function(k) {
		var maxInterval = (Math.pow(2, k) - 1) * 1000;

		if (maxInterval > 30 * 1000) {
			maxInterval = 30 * 1000;
		}

		return Math.random() * maxInterval; 
	},

	_flushData: function() {
		this.set('open', false);

		this.set('channelUsers', Ember.A());
		this.set('events', Ember.A());
		this.set('commands', Ember.A());
		this.set('highlights', Ember.A());
		// empty some collections

		App.__container__.lookup('controller:disconnected').send('openIfClosed');
	},

	_setup: function() {
		var self = this;

		this.emitter.setup(this.container, this.controllers);
		// setup the event emitter

		this.set('open', true);
		this.set('done', false);
		this.emitter.on('done', function() {
			self.set('done', true);
		});
		// alter the done variable when we're actually done

		if (document.cookie) {
			this._send('authenticate', {cookie: document.cookie});
			// authenticate
		} else {
			self.set('authed', false);
		}

		App.__container__.lookup('controller:disconnected').send('closeIfOpen');
		// close if a modal window is open
	},

	_listen: function(incoming) {
		var self = this,
			event = incoming.event,
			data = incoming.data;

		var userInsertCheck = function(col, u) {
			return col.find(function(key, i) {
				return (u.nickname == i.nickname && u.network == i.network && u.channel == i.channel);
			});
		};

		switch (event) {
			case 'authenticate':
				var authed = data.authenticated || false;
				self.set('authed', authed);
				break;
			case 'burst':
				Ember.$.get(data.url, function(data) {
					for (var type in data) {
						if (type === 'burstend' && data[type] === true) {
							self.emitter.trigger('done');
						} else {
							self._store(type, data[type], true);
						}
					}

					self._loadComplete(true);
				});
				break;
			case 'channelUsers':
				self._store('channelUsers', data, false, userInsertCheck);
				self.emitter.trigger('updated');
				break;
			case 'events':
				self._store('events', data, true);
				self.emitter.trigger('updated');
				break;
			case 'updateUser':
				self._update('users', data._id, data);
				break;
			case 'addNetwork':
				self._store('networks', [data]);
				break;
			case 'updateNetwork':
				self._update('networks', data._id, data);
				break;
			case 'removeNetwork':
				self._delete('networks', data._id);
				break;
			case 'addTab':
				self._store('tabs', [data]);
				break;
			case 'updateTab':
				self._update('tabs', data._id, data);
				break;
			case 'removeTab':
				self._delete('tabs', data._id);
				break;
			case 'newEvent':
				self._store('events', [data]);
				break;
			case 'updateEvent':
				self._update('events', data._id, data);
				break;
			case 'newBacklog':
				self._store('commands', [data]);
				break;
			case 'removeBacklog':
				self._delete('commands', data._id);
				break;
			case 'newChannelUser':
				self._store('channelUsers', [data], false, userInsertCheck);
				break;
			case 'updateChannelUser':
				self._update('channelUsers', data._id, data);
				break;
			case 'removeChannelUser':
				self._delete('channelUsers', data._id);
				break;
			case 'banList':
				self.emitter.determineEvent('banList', 'new', data, false);
				break;
			case 'inviteList':
				self.emitter.determineEvent('inviteList', 'new', data, false);
				break;
			case 'exceptList':
				self.emitter.determineEvent('exceptList', 'new', data, false);
				break;
			case 'quietList':
				self.emitter.determineEvent('quietList', 'new', data, false);
				break;
			case 'openList':
				self.emitter.determineEvent('openList', 'new', data, false);
				break;
			case 'list':
				self.emitter.determineEvent('list', 'new', data, false);
				break;
			case 'whois':
				self.emitter.determineEvent('whois', 'new', data, false);
				break;
			default:
				console.warn('Recieved unknown RPC event:', event, data);
				break;
		}
	},

	_store: function(collection, payload, noEvent, fn) {
		var self = this,
			col = self.get(collection);

		noEvent = noEvent || false;
		fn = fn || false;

		for (var k = 0, len = payload.length; k < len; k++) {
			var i = payload[k],
				exists = col.findBy('_id', i._id);
			
			if (!exists && fn) {
				exists = fn(col, i);
			}
			
			if (exists) {
				exists.setProperties(i);
			} else {
				var obj = Ember.Object.create(i);
				col.pushObject(obj);
				// add the object

				self.emitter.determineEvent(collection, 'new', obj, noEvent);
				// figure out what event to push
			}
		}
	},

	_update: function(type, id, changes) {
		var self = this,
			collection = this.get(type);
		
		if (!collection) {
			return false;
		}

		var object = collection.findBy('_id', id);
		// find the object

		if (!object) {
			return false;
		}
		// object doesnt even exist? :/

		object.setProperties(changes);
		// overwrite them in the set

		self.emitter.determineEvent(type, 'update', object);
		// figure out what event to push
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

		self.emitter.determineEvent(type, 'delete', object);
		// figure out what event to push
	},

	_deleteWhere: function(type, query) {
		var self = this,
			collection = this.get(type),
			records = this._find(true, type, query);

		if (!collection) {
			return false;
		}

		records.forEach(function(object) {
			collection.removeObject(object);
			// bump it out

			self.emitter.determineEvent(type, 'delete', object);
			// figure out what event to push
		});
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
			collection = this.get(type),
			collectionSet;
		
		if (!collection) {
			return false;
		}

		if (many) {
			collectionSet = collection.filter(function(obj) {
				return self._search(query, obj);
			});
		} else {
			collectionSet = collection.find(function(obj) {
				return self._search(query, obj);
			});
		}
		// attempt to find

		if (collectionSet) {
			return (many) ? collectionSet.toArray() : collectionSet;
		} else {
			return false;
		}
	},

	_send: function(event, payload) {
		if (this.socket && this.open) {	
			this.socket.send(JSON.stringify({event: event, data: payload}));
		}
	},

	findOne: function(type, query) {
		return this._find(false, type, query);
	},

	find: function(type, query) {
		return this._find(true, type, query);
	},

	findButWait: function(type, query, one) {
		var self = this,
			_getResults;

		one = one || false;

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

	send: function(command, query, data) {
		if (!command || !query) {
			return false;
		}

		this._send(command, (data) ? {query: query, object: data} : {object: query});
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