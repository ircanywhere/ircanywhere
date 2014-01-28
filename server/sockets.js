var _ = require('lodash'),
	hooks = require('hooks'),
	helper = require('../lib/helpers').Helpers,
	mongo = require('mongodb');

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
			return ((update.hiddenUsers && typeof update.hiddenUsers === 'boolean') ||
					(update.hiddenEvents && typeof update.hiddenEvents === 'boolean') || 
					(update.selected && typeof update.selected === 'boolean'));
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
			return ((insert.target && typeof insert.target === 'string') &&
					(insert.network && typeof insert.network === 'string') &&
					(insert.selected && typeof insert.selected === 'boolean'));
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
			if (_.has(update, 'selected')) {
				application.Tabs.sync.update({user: uid, selected: true}, {$set: {selected: false}});
			}
			// also check for selected here, if a new tab is being selected then we will
			// force the de-selection of the others

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
			var client = Clients[new mongo.ObjectID(insert.network)];

			if (client && client.internal.userId.toString() === uid.toString()) {
				var type = (helper.isChannel(client.internal.capabilities.channel.types, insert.target)) ? 'channel' : 'query';
				networkManager.addTab(client, insert.target, type, insert.selected);
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
			return ((insert.command && insert.network) &&
					(insert.target !== '') &&
					(insert.backlog !== undefined));
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

	application.ee.on(['*', '*'], function(doc, ext) {
		var collection = this.event[0],
			eventName = this.event[1],
			clients = [];

		if (_.indexOf(self.propogate, collection) == -1) {
			return false;
		}

		if (collection === 'users') {
			clients.push(Users[doc._id.toString()]);
		} else if (collection === 'networks') {
			clients.push(Users[doc.internal.userId.toString()]);
		} else if (collection === 'tabs' || collection === 'events' || collection === 'commands') {
			if (collection === 'commands' && !doc.backlog) {
				return false;
			}
			
			clients.push(Users[doc.user.toString()]);
		} else if (collection === 'channelUsers' && !doc._burst) {
			for (var id in Clients) {
				for (var tabId in Clients[id].internal.tabs) {
					var tab = Clients[id].internal.tabs[tabId];

					if (tab.networkName == doc.network && doc.channel == tab.target) {
						clients.push(Users[tab.user.toString()]);
					}
				}
			}
		}

		clients.forEach(function(client) {
			if (!client) {
				return false;
			}
			// bail if its undefined

			if (eventName === 'insert') {
				client.send(eventName, {collection: collection, record: doc});
			} else if (eventName === 'update') {
				client.send(eventName, {collection: collection, id: doc._id.toString(), record: doc});
			} else if (eventName === 'delete') {
				client.send(eventName, {collection: collection, id: doc._id.toString()});
			}
		});
		// all of this code works by watching changes via the oplog, that way 
		// we dont need to worry about updating the database AND sending changes
		// to the frontend clients, we can just send the document down when we spot a change
		// to the clients who need to see it, a bit like meteor, without subscriptions
	});

	application.sockjs.on('connection', function (client) {
		client.send = function(event, data) {
			client.write(JSON.stringify({event: event, data: data}));
			return client;
		}
		// define a function to ease this

		client.on('data', function(message) {
			fibrous.run(function() {
				var parsed = JSON.parse(message),
					event = parsed.event,
					data = parsed.data;

				if (event === 'authenticate') {
					self.handleAuth(client, data, function() {
						self.handleConnect(client);
						// handle success
					});
				}
				// socket authentication

				if (event === 'events') {
					self.handleEvents(client, data);
				}
				// handle requesting of data from events collection

				if (event === 'insert') {
					self.handleInsert(client, data);
				}
				// handle inserts

				if (event === 'update') {
					self.handleUpdate(client, data);
				}
				// handle updates
			});
		});

		client.on('close', function() {
			fibrous.run(function() {
				self.handleDisconnect(client);
			});
		});
		// handle disconnects
	});
}

/**
 * Handles the authentication command sent to us from websocket clients
 * Authenticates us against login tokens in the user record, disconnects if
 * expired or incorrect.
 *
 * @method 	handleAuth
 * @param 	{Object} client
 * @param 	{Object} data
 * @param 	{Function} callback
 * @extend	true
 * @return 	void
 */
SocketManager.prototype.handleAuth = function(client, data, callback) {
	var parsed = (data) ? data.split('; ') : [],
		cookies = {};

	parsed.forEach(function(cookie) {
		var split = cookie.split('=');
			cookies[split[0]] = split[1];
	});
	// get our cookies

	if (!cookies.token) {
		client.send('authenticate', false).close();
		return false;
	} else {
		var query = {};
			query['tokens.' + cookies.token] = {$exists: true};
		var user = application.Users.sync.findOne(query);

		if (user === null) {
			client.send('authenticate', false).close();
			return false;
		} else {
			if (new Date() > user.tokens[cookies.token].time) {
				var unset = {};
					unset['tokens.' + cookies.token] = 1;
				
				application.Users.sync.update(query, {$unset: unset});
				// token is expired, remove it

				client.send('authenticate', false).close();
				return false;
			} else {
				client.user = user;
			}
		}
	}
	// validate the cookie

	callback();
	// go go
}

/**
 * Handles new websocket clients, this is only done after
 * they have been authenticated and it's been accepted.
 * 
 * @method 	handleConnect
 * @param 	{Object} client
 * @extend	true
 * @return 	void
 */
SocketManager.prototype.handleConnect = function(client) {
	var user = client.user,
		networks = application.Networks.sync.find({'internal.userId': user._id}).sync.toArray(),
		tabs = application.Tabs.sync.find({user: user._id}).sync.toArray(),
		netIds = {},
		events = [],
		usersQuery = {$or: []},
		commandsQuery = {$or: []};

	Sockets[client.id] = user;
	Users[user._id.toString()] = client; 
	// remember the link between the socket and the user

	networks.forEach(function(network) {
		netIds[network._id] = network.name;
	});

	tabs.forEach(function(tab) {
		usersQuery['$or'].push({network: netIds[tab.network], channel: tab.title});
		commandsQuery['$or'].push({network: tab.network, target: tab.title});

		var target = (tab.type === 'network') ? '*' : tab.title,
			query = {network: netIds[tab.network], target: target, user: user._id},
			eventResults = application.Events.sync.find(query).sort({$natural: -1}).sync.toArray(),
			unreadItems = application.Events.sync.find(_.extend({read: false}, query)).sync.count(),
			unreadHighlights = application.Events.sync.find(_.extend({'extra.highlight': true, read: false}, query)).sync.count();
		// get some information about the unread items/highlights

		tab.unread = unreadItems;
		tab.highlights = unreadHighlights;
		events = _.union(events, eventResults);
		// combine the results
	});
	// loop tabs

	var users = application.ChannelUsers.sync.find(usersQuery).sync.toArray(),
		commands = application.Commands.sync.find(_.extend({user: user._id, backlog: true}, commandsQuery)).sync.toArray();
	// sort and limit them

	client.send('users', user);
	client.send('networks', networks);
	client.send('tabs', tabs);
	client.send('channelUsers', users);
	client.send('events', events);
	client.send('commands', commands);
	// compile a load of data to send to the frontend
}

/**
 * Handles websocket disconnections
 *
 * @method 	handleDisconnect
 * @param 	{Object} client
 * @extend	true
 * @return 	void
 */
SocketManager.prototype.handleDisconnect = function(client) {
	var user = Sockets[client.id];

	delete Users[user._id.toString()];
	delete Sockets[client.id];
	// clean up
}

/**
 * Handles queries to the events collection
 *
 * @method 	handleEvents
 * @param 	{Object} client
 * @param 	{Object} data
 * @return 	void
 */
SocketManager.prototype.handleEvents = function(client, data) {
	var response = application.Events.sync.find(data).sync.toArray();
	// perform the query

	client.send('events', response);
	// get the data
}

/**
 * Handles insert rpc calls
 *
 * @method 	handleInsert
 * @param 	{Object} client
 * @param 	{Object} data
 * @return 	void
 */
SocketManager.prototype.handleInsert = function(client, data) {
	var collection = data.collection,
		insert = data.insert,
		user = client.user;

	if (!collection || !insert) {
		client.send('error', {command: 'insert', error: 'invalid format'});
		return;
	}

	if (!_.isFunction(this.allowRules[collection]['insert']) || !_.isFunction(this.operationRules[collection]['insert'])) {
		client.send('error', {command: 'insert', error: 'cant insert'});
		return;
	}

	if (!this.allowRules[collection]['insert'](user._id, insert)) {
		client.send('error', {command: 'insert', error: 'not allowed'});
		return;
	}
	// have we been denied?

	this.operationRules[collection]['insert'](user._id, insert);
	// insert
}

/**
 * Handles update rpc calls
 *
 * @method 	handleUpdate
 * @param 	{Object} client
 * @param 	{Object} data
 * @return 	void
 */
SocketManager.prototype.handleUpdate = function(client, data) {
	var collection = data.collection,
		query = data.query,
		update = data.update,
		user = client.user;

	if (!collection || !query || !update) {
		return client.send('error', {command: 'update', error: 'invalid format'});
	}

	if (!_.isFunction(this.allowRules[collection]['update']) || !_.isFunction(this.operationRules[collection]['update'])) {
		return client.send('error', {command: 'update', error: 'cant update'});
	}

	if (query._id) {
		query._id = new mongo.ObjectID(query._id);
	}
	// update it to a proper mongo id

	if (!this.allowRules[collection]['update'](user._id, query, update)) {
		returnclient.send('error', {command: 'update', error: 'not allowed'});
	}
	// have we been denied?

	this.operationRules[collection]['update'](user._id, query, update);
	// update
}

exports.SocketManager = _.extend(SocketManager, hooks);