var _ = require('lodash'),
	hooks = require('hooks'),
	helper = require('../lib/helpers').Helpers,
	WebSocket = require('./websocket').WebSocket,
	mongo = require('mongodb');

/*
 * XXX:
 *		I want to rename this to observer/rpc at some point in 0.2.0 final and merge the commands
 * 		into a more RPC style which are probably defined in websocket.js, because the majority
 * 		of this code is handling the mongo observer stuff and handling allow rules. Little of it
 *		is socket based code, and only a bit of it is socket managing code.
 *
 *		I also want to incorporate it all (especially the allow rules) into a more DI based style
 *		where any modules can inject their own RPC methods and allow rules by just putting
 *		items into the prototype (is this possible?) or extend based, for example;
 *
 *		CustomModule = _.extend(BaseModule, {
 *			'allow.collection': {
 *				insert:	function() { ... }
 * 			},
 *			rpc: {
 *				mySocketCommand: function() { ... }
 *			}
 *		});
 *
 * 		These would just inject the rpc methods / allow rules into the main RPC manager (this).
 *		Or something similar. I'll spend time ironing out the details at some point
 */

/**
 * Responsible for handling all the websockets and their RPC-style commands
 *
 * @class 	SocketManager
 * @method 	SocketManager
 * @extend	false
 * @return 	void
 */
function SocketManager() {
	var self = this;

	this.allowRules = {};
	this.operationRules = {};
	this.propogate = ['users', 'networks', 'tabs', 'events', 'channelUsers', 'commands'];
	// collections with allowed update rules
	// very similar to Meteor - basically just reimplementing it, doesn't support advanced queries though

	this.allow('users', {
		/**
		 * An allow rule for updates to the user record, we can only change the selectedTab
		 * value here and it only works for the logged in user.
		 *
		 * @method 	update
		 * @param 	{ObjectID} uid
		 * @param 	{Object} query
		 * @param 	{Object} update
		 * @extend 	false
		 * @private
		 * @return 	{Boolean}
		 */
		update: function(uid, query, update) {
			var allow = false,
				allowed = ['selectedTab'];
			
			_.forOwn(update, function(value, item) {
				if ((item === 'selectedTab') && typeof value === 'string') {
					allow = true;
				}
				// check the values?

				if (_.indexOf(allowed, item) === -1) {
					allow = false;
				}
				// invalid key
			});
			
			return allow;
		}
	});

	this.rules('users', {
		/**
		 * An update rule to execute when we've passed the allow rules
		 *
		 * @method 	update
		 * @param 	{ObjectID} uid
		 * @param 	{Object} query
		 * @param 	{Object} update
		 * @extend 	false
		 * @private
		 * @return 	void
		 */
		update: function(uid, query, update) {
			application.Users.sync.update({_id: uid}, {$set: update});
			// update
		}
	});

	this.allow('tabs', {
		/**
		 * An allow rule for updates to the tab collections, checks the correct properties
		 * are being updated and their type, also then checks if they are allowed to update
		 * the specific document.
		 *
		 * @method 	update
		 * @param 	{ObjectID} uid
		 * @param 	{Object} query
		 * @param 	{Object} update
		 * @extend 	false
		 * @private
		 * @return 	{Boolean}
		 */
		update: function(uid, query, update) {
			var allow = false,
				allowed = ['hiddenUsers', 'hiddenEvents'];
			
			_.forOwn(update, function(value, item) {
				if ((item === 'hiddenUsers' || item == 'hiddenEvents') && typeof value === 'boolean') {
					allow = true;
				}
				// check the values?

				if (_.indexOf(allowed, item) === -1) {
					allow = false;
				}
				// invalid key
			});
			
			return allow;
		},

		/**
		 * An allow rule for inserts to the tab collection, we check for target, type and
		 * network id
		 *
		 * @method 	update
		 * @param 	{ObjectID} uid
		 * @param 	{Object} insert
		 * @extend 	false
		 * @private
		 * @return 	{Boolean}
		 */
		insert: function(uid, insert) {
			var allow = false,
				allowed = ['target', 'network', 'selected'];
			
			_.forOwn(insert, function(value, item) {
				if ((item === 'target' || item === 'network') && typeof value === 'string') {
					allow = true;
				}

				if (item === 'selected' && typeof value === 'boolean') {
					allow = true;
				}
				// check the values?

				if (_.indexOf(allowed, item) === -1) {
					allow = false;
				}
				// invalid key
			});
			
			return allow;
		}
	});

	this.rules('tabs', {
		/**
		 * An update rule to execute when we've passed the allow rules
		 *
		 * @method 	update
		 * @param 	{ObjectID} uid
		 * @param 	{Object} query
		 * @param 	{Object} update
		 * @extend 	false
		 * @private
		 * @return 	void
		 */
		update: function(uid, query, update) {
			application.Tabs.sync.update(_.extend(query, {user: uid}), {$set: update});
			// update
		},

		/**
		 * An insert rule for the tab collection
		 *
		 * @method 	insert
		 * @param 	{ObjectID} uid
		 * @param 	{Object} insert
		 * @extend 	false
		 * @private
		 * @return 	void
		 */
		insert: function(uid, insert) {
			var ircClient = Clients[new mongo.ObjectID(insert.network)];

			if (ircClient && ircClient.internal.userId.toString() === uid.toString()) {
				var type = (helper.isChannel(ircClient, insert.target)) ? 'channel' : 'query';
				networkManager.addTab(ircClient, insert.target, type, insert.selected);
			}
			// we're allowed to continue, use network manager to add the tab
		},
	})

	this.allow('commands', {
		/**
		 * An allow rule for inserts to the commands collection, similar to the one above
		 * checks for parameters then their uid to see if they can insert a command into that tab
		 *
		 * @method 	insert
		 * @param 	{ObjectID} uid
		 * @param 	{Object} insert
		 * @extend 	false
		 * @private
		 * @return 	{Boolean}
		 */
		insert: function(uid, insert) {
			var allow = false,
				allowed = ['command', 'network', 'target', 'backlog'];
			
			_.forOwn(insert, function(value, item) {
				if ((item === 'command' || item === 'network' || item === 'target') && typeof value === 'string') {
					allow = true;
				}

				if (item === 'backlog' && typeof value === 'boolean') {
					allow = true;
				}
				// check the values?

				if (_.indexOf(allowed, item) === -1) {
					allow = false;
				}
				// invalid key
			});
			
			return allow;
		}
	});

	this.rules('commands', {
		/**
		 * An insert date rule to execute when we've passed the allow rules
		 *
		 * @method 	insert
		 * @param 	{ObjectID} uid
		 * @param 	{Object} update
		 * @extend 	false
		 * @private
		 * @return 	void
		 */
		insert: function(uid, insert) {
			var find = application.Tabs.sync.findOne({networkName: insert.network, user: uid, target: insert.target});
			// try and find a valid tab

			if (!find) {
				return;
			}

			insert.user = uid;
			insert.timestamp = +new Date();
			insert.network = find.network;
			// bail if we can't find the tab, if we can re-set the network value

			application.Commands.sync.insert(insert);
			// insert
		}
	});

	this.allow('events', {
		/**
		 * An update rule to execute when we've passed the allow rules
		 *
		 * @method 	update
		 * @param 	{ObjectID} uid
		 * @param 	{Object} query
		 * @param 	{Object} update
		 * @extend 	false
		 * @private
		 * @return 	void
		 */
		update: function(uid, query, update) {
			return (_.difference(_.keys(update), ['read']).length === 0 && typeof update.read === 'boolean');
		}
	});

	this.rules('events', {
		/**
		 * An update rule to execute when we've passed the allow rules
		 *
		 * @method 	update
		 * @param 	{ObjectID} uid
		 * @param 	{Object} query
		 * @param 	{Object} update
		 * @extend 	false
		 * @private
		 * @return 	void
		 */
		update: function(uid, query, update) {
			if ('$or' in query) {
				for (var i in query['$or']) {
					var subQuery = query['$or'][i];

					if ('_id' in subQuery) {
						subQuery._id = new mongo.ObjectID(subQuery._id);
						query.$or[i] = subQuery;
					}
				}
			}
			// convert _id to proper mongo IDs
			
			application.Events.sync.update(query, {$set: update}, {multi: true});
		}
	});

	application.ee.on('ready', function() {
		fibrous.run(self.init.bind(self));
	});
}

/**
 * Responsible for setting allow rules on collection modifications from the client side
 * currently only compatible with inserts and updates.
 *
 * @method 	allow
 * @param 	{String} collection
 * @param 	{Object} object
 * @extend	true
 * @return 	void
 */
SocketManager.prototype.allow = function(collection, object) {
	var self = this;

	for (var operation in object) {
		var fn = object[operation];

		if (!self.allowRules[collection]) {
			self.allowRules[collection] = {};
		}

		self.allowRules[collection][operation] = fn;
	}
}

/**
 * Responsible for setting operation rules on how to update things
 *
 * @method 	rules
 * @param 	{String} collection
 * @param 	{Object} object
 * @extend	true
 * @return 	void
 */
SocketManager.prototype.rules = function(collection, object) {
	var self = this;

	for (var operation in object) {
		var fn = object[operation];

		if (!self.operationRules[collection]) {
			self.operationRules[collection] = {};
		}

		self.operationRules[collection][operation] = fn;
	}
}
	
/**
 * Called when the application is ready, sets up an observer on our collections
 * so we can figure out whether we need to propogate them to clients and who to.
 *
 * We also setup the websocket connection handlers and everything relating to that here.
 *
 * @method 	init
 * @extend 	true
 * @return 	void
 */
SocketManager.prototype.init = function() {
	var self = this;

	application.ee.on(['*', '*'], function(doc) {
		var collection = this.event[0],
			eventName = this.event[1],
			clients = [];

		if (_.indexOf(self.propogate, collection) === -1) {
			return false;
		}

		if (eventName === 'update' && collection === 'users') {
			clients.push(Users[doc._id]);
			
			delete doc.lastSeen;
			doc = _.omit(doc, 'salt', 'password', 'tokens');
			// alter the document if need be
		} else if (collection === 'networks') {
			clients.push(Users[doc.internal.userId]);
		} else if (collection === 'tabs' || collection === 'events' || collection === 'commands') {
			if ((collection === 'commands' && !doc.backlog) || (eventName === 'update' && collection === 'events')) {
				return false;
			}
			// ignore specific scenarios
			
			clients.push(Users[doc.user]);
			// get the client

			if (collection === 'events') {
				doc = _.omit(doc, 'user');
			}
			// alter the document if need be
		} else if (collection === 'channelUsers' && !doc._burst) {
			for (var id in Clients) {
				for (var tabId in Clients[id].internal.tabs) {
					var tab = Clients[id].internal.tabs[tabId];

					if (tab.networkName == doc.network && doc.channel == tab.target) {
						clients.push(Users[tab.user]);
					}
				}
			}
			// find the client list

			doc = _.omit(doc, 'username', 'hostname', '_burst');
			// alter the document if need be
		}

		clients.forEach(function(socket) {
			if (!socket) {
				return false;
			}
			// bail if its undefined

			if (eventName === 'insert') {
				socket.send(eventName, {collection: collection, record: doc});
			} else if (eventName === 'update') {
				socket.send(eventName, {collection: collection, id: doc._id.toString(), record: doc});
			} else if (eventName === 'delete') {
				socket.send(eventName, {collection: collection, id: doc._id.toString()});
			}
		});
		// all of this code works by watching changes via the oplog, that way 
		// we dont need to worry about updating the database AND sending changes
		// to the frontend clients, we can just send the document down when we spot a change
		// to the clients who need to see it, a bit like meteor, without subscriptions
	});
}

/**
 * Handles a new websocket opening
 *
 * @method 	onSocketOpen
 * @param 	{Object} socket
 * @extend	true
 * @return 	void
 */
SocketManager.prototype.onSocketOpen = function(socket) {
	// so here we handle incoming websocket connections
	// and then wrap them in our own websocket rpc which handles
	// event binding and such, doing this allows us to quickly
	// switch websocket engines if we ever need to and gives us a standard
	// api which is extendable by people writing modules

	var webSocket = new WebSocket(socket);
	// create the websocket and assign it to Sockets[id]
	// websocket constructor handles event binding etc

	webSocket.on('authenticate', function(data) {
		fibrous.run(function() {
			socketManager.handleAuth(webSocket, data);
		});
	});

	webSocket.on('events', function(data) {
		fibrous.run(function() {
			socketManager.handleEvents(webSocket, data);
		});
	});

	webSocket.on('insert', function(data) {
		fibrous.run(function() {
			socketManager.handleInsert(webSocket, data);
		});
	});

	webSocket.on('update', function(data) {
		fibrous.run(function() {
			socketManager.handleUpdate(webSocket, data);
		});
	});

	Sockets[socket.id] = webSocket;
}

/**
 * Handles the authentication command sent to us from websocket clients
 * Authenticates us against login tokens in the user record, disconnects if
 * expired or incorrect.
 *
 * @method 	handleAuth
 * @param 	{Object} socket
 * @param 	{Object} data
 * @param 	{Function} callback
 * @extend	true
 * @return 	void
 */
SocketManager.prototype.handleAuth = function(socket, data) {
	var user = userManager.isAuthenticated(data);
	
	if (!user) {
		socket.send('authenticate', false, true);
	} else {
		socket._user = user;
		Users[user._id] = socket;

		socket.send('authenticate', true, false);

		this.handleConnect(socket);
		// handle sending out data on connect
	}
}

/**
 * Handles new websocket clients, this is only done after
 * they have been authenticated and it's been accepted.
 * 
 * @method 	handleConnect
 * @param 	{Object} socket
 * @extend	true
 * @return 	void
 */
SocketManager.prototype.handleConnect = function(socket) {
	var user = socket._user,
		networks = application.Networks.sync.find({'internal.userId': user._id}).sync.toArray(),
		tabs = application.Tabs.sync.find({user: user._id}).sync.toArray(),
		netIds = {},
		items = [],
		usersQuery = {$or: []},
		commandsQuery = {$or: []};

	var tabUrls = _.map(tabs, 'url');
	if (tabUrls.indexOf(user.selectedTab) === -1) {
		user.selectedTab = tabs[0].url;
	}
	// determine whether we have a selected tab or not?

	networks.forEach(function(network) {
		netIds[network._id] = {
			name: network.name,
			nick: network.nick.toLowerCase()
		};
	});

	tabs.forEach(function(tab, index) {
		usersQuery['$or'].push({network: netIds[tab.network].name, channel: tab.target});
		commandsQuery['$or'].push({network: tab.network, target: tab.target});
		// construct some queries

		if (tab.type === 'query') {
			var query = {network: netIds[tab.network].name, user: user._id, $or: [{target: tab.target}, {'message.nickname': new RegExp(tab.target, 'i'), target: netIds[tab.network].nick}]};
		} else if (tab.type === 'network') {
			var query = {network: netIds[tab.network].name, target: '*', user: user._id}
		} else {
			var query = {network: netIds[tab.network].name, target: tab.target, user: user._id}
		}

		var eventResults = application.Events.sync.find(query, ['_id', 'extra', 'message', 'network', 'read', 'target', 'type']).sort({$natural: -1}).limit(50).sync.toArray(),
			unreadItems = application.Events.sync.find(_.extend({read: false}, query)).sync.count(),
			unreadHighlights = application.Events.sync.find(_.extend({'extra.highlight': true, read: false}, query)).sync.count();
		// get some information about the unread items/highlights

		tab.unread = unreadItems;
		tab.highlights = unreadHighlights;
		items = _.union(items, eventResults);
		// combine the results
	});
	// loop tabs

	if (tabs.length === 0) {
		var users = [],
			commands = [];
	} else {
		var users = application.ChannelUsers.sync.find(usersQuery, ['nickname', 'network', 'channel', 'sort', 'prefix', '_id']).sync.toArray(),
			commands = application.Commands.sync.find(_.extend({user: user._id, backlog: true}, commandsQuery)).sync.toArray();
	}
	// get channel users and commands

	socket.sendBurst({
		users: [_.omit(user, 'salt', 'password', 'tokens')],
		networks: networks,
		tabs: tabs,
		channelUsers: users,
		events: items,
		commands: commands,
		burstend: true
	});
	// send the info

	application.Users.update({_id: user._id}, {$set: {lastSeen: new Date(), selectedTab: user.selectedTab}}, {safe: false});
	// update last seen time
}

/**
 * Handles queries to the events collection
 *
 * @method 	handleEvents
 * @param 	{Object} socket
 * @param 	{Object} data
 * @return 	void
 */
SocketManager.prototype.handleEvents = function(socket, data) {
	var response = application.Events.sync.find(data).sync.toArray();
	// perform the query

	socket.send('events', response);
	// get the data
}

/**
 * Handles insert rpc calls
 *
 * @method 	handleInsert
 * @param 	{Object} socket
 * @param 	{Object} data
 * @return 	void
 */
SocketManager.prototype.handleInsert = function(socket, data) {
	var collection = data.collection,
		insert = data.insert,
		user = socket._user;

	if (!collection || !insert) {
		return socket.send('error', {command: 'insert', error: 'invalid format'});
	}

	if (!_.isFunction(this.allowRules[collection]['insert']) || !_.isFunction(this.operationRules[collection]['insert'])) {
		return socket.send('error', {command: 'insert', error: 'cant insert'});
	}

	if (this.allowRules[collection]['insert'](user._id, insert)) {
		this.operationRules[collection]['insert'](user._id, insert);
	} else {
		return socket.send('error', {command: 'insert', error: 'not allowed'});
	}
	// have we been denied?
}

/**
 * Handles update rpc calls
 *
 * @method 	handleUpdate
 * @param 	{Object} socket
 * @param 	{Object} data
 * @return 	void
 */
SocketManager.prototype.handleUpdate = function(socket, data) {
	var collection = data.collection,
		query = data.query,
		update = data.update,
		user = socket._user;

	if (!collection || !query || !update) {
		return socket.send('error', {command: 'update', error: 'invalid format'});
	}

	if (!_.isFunction(this.allowRules[collection]['update']) || !_.isFunction(this.operationRules[collection]['update'])) {
		return socket.send('error', {command: 'update', error: 'cant update'});
	}

	if (query._id) {
		query._id = new mongo.ObjectID(query._id);
	}
	// update it to a proper mongo id

	if (this.allowRules[collection]['update'](user._id, query, update)) {
		this.operationRules[collection]['update'](user._id, query, update);
	} else {
		return socket.send('error', {command: 'update', error: 'not allowed'});
	}
	// have we been denied?
}

exports.SocketManager = _.extend(SocketManager, hooks);