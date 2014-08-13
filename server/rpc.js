/**
 * IRCAnywhere server/rpc.js
 *
 * @title RPCHandler
 * @copyright (c) 2013-2014 http://ircanywhere.com
 * @license GPL v2
 * @author Ricki Hastings
*/

var _ = require('lodash'),
	hooks = require('hooks'),
	helper = require('../lib/helpers').Helpers,
	WebSocket = require('./websocket').WebSocket,
	mongo = require('mongodb'),
	Q = require('q');

/**
 * Singleton class to handle the inbound and outbound RPC calls on the websocket lines
 *
 * @class RPCHandler
 * @method RPCHandler
 * @return void
 */
function RPCHandler() {
	var self = this;

	application.ee.on('ready', self.init.bind(self));
}

/**
 * Called when the application is ready, sets up an observer on our collections
 * so we can figure out whether we need to propogate them to clients.
 *
 * @method init
 * @return void
 */
RPCHandler.prototype.init = function() {
	var self = this;

	application.ee.on(['users', 'update'], self.handleUsersUpdate);
	application.ee.on(['networks', '*'], self.handleNetworksAll);
	application.ee.on(['tabs', '*'], self.handleTabsAll);
	application.ee.on(['events', '*'], self.handleEventsAll);
	application.ee.on(['commands', '*'], self.handleCommandsAll);
	application.ee.on(['channelUsers', '*'], self.handleChannelUsersAll);
	// handle changes to our collections individually this time
};

/**
 * Pushes the data and command out to any sockets associated to that uid
 *
 * @method push
 * @param {String} uid A valid user id converted from an object ID
 * @param {String} command The command to send
 * @param {String} data The json data to send
 * @return void
 */
RPCHandler.prototype.push = function(uid, command, data) {
	if (typeof uid === 'object') {
		uid = uid.toString();
	}

	var sockets = Users[uid];

	if (sockets) {
		sockets.forEach(function(s) {
			if (s.socket) {
				s.socket.send(command, data);
			}
		});
	}
};

/**
 * Handles any update changes to the users collection and sends changes to clients
 *
 * @method handleUsersUpdate
 * @param {Object} doc A valid MongoDB document with an _id
 * @return void
 */
RPCHandler.prototype.handleUsersUpdate = function(doc) {
	if (!doc) {
		return false;
	}
	
	delete doc.lastSeen;
	doc = _.omit(doc, 'salt', 'password', 'tokens');
	// alter the document

	rpcHandler.push(doc._id, 'updateUser', doc);
};

/**
 * Handles any all changes to the network collection
 *
 * @method handleNetworksAll
 * @param {Object} doc A valid MongoDB document with an _id
 * @return void
 */
RPCHandler.prototype.handleNetworksAll = function(doc) {
	if (!doc || !doc.internal) {
		return false;
	}

	var eventName = this.event[1];

	if (eventName === 'insert') {
		rpcHandler.push(doc.internal.userId, 'addNetwork', doc);
	} else if (eventName === 'update') {
		rpcHandler.push(doc.internal.userId, 'updateNetwork', doc);
	} else if (eventName === 'delete') {
		rpcHandler.push(doc.internal.userId, 'removeNetwork', doc);
	}
};

/**
 * Handles all changes to the tabs collections
 *
 * @method handleTabsAll
 * @param {Object} doc A valid MongoDB document with an _id
 * @return void
 */
RPCHandler.prototype.handleTabsAll = function(doc) {
	if (!doc) {
		return false;
	}

	var eventName = this.event[1],
		uid = false;

	if (eventName === 'delete') {
		_.each(Clients, function(value, key) {
			var tab = _.find(value.internal.tabs, {'_id': doc});
			if (tab) {
				uid = value.internal.userId;
				delete Clients[key].internal.tabs[tab.target];
			}
		});
		// find out which user this tab belongs to?
	} else {
		uid = doc.user;
	}

	if (eventName === 'insert') {
		rpcHandler.push(uid, 'addTab', doc);
	} else if (eventName === 'update') {
		rpcHandler.push(uid, 'updateTab', doc);
	} else if (eventName === 'delete') {
		rpcHandler.push(uid, 'removeTab', doc);
	}
};

/**
 * Handles any changes to the events collection
 *
 * @method handleEventsAll
 * @param {Object} doc A valid MongoDB document with an _id
 * @return void
 */
RPCHandler.prototype.handleEventsAll = function(doc) {
	if (!doc) {
		return false;
	}

	var eventName = this.event[1],
		uid = doc.user;
	
	doc = _.omit(doc, 'user');
	// alter the document

	if (eventName === 'insert') {
		rpcHandler.push(uid, 'newEvent', doc);
	} else if (eventName === 'update') {
		rpcHandler.push(uid, 'updateEvent', doc);
	}
};

/**
 * Handles all operations on the commands collection
 *
 * @method handleCommandsAll
 * @param {Object} doc A valid MongoDB document with an _id
 * @return void
 */
RPCHandler.prototype.handleCommandsAll = function(doc) {
	if (!doc || doc.backlog) {
		return false;
	}

	var eventName = this.event[1];

	if (eventName === 'insert') {
		rpcHandler.push(doc.user, 'newBacklog', doc);
	} else if (eventName === 'delete') {
		rpcHandler.push(doc.user, 'removeBacklog', doc);
	}
};


/**
 * Handles any changes on the channelUsers collection
 *
 * @method handleChannelUsersAll
 * @param {Object} doc A valid MongoDB document with an _id
 * @return void
 */
RPCHandler.prototype.handleChannelUsersAll = function(doc, ext) {
	if (!doc) {
		return false;
	}

	var query = (ext) ? {'networkName': ext.network, 'target': ext.channel} : {'networkName': doc.network, 'target': doc.channel},
		eventName = this.event[1],
		uid = false;

	doc = _.omit(doc, 'username', 'hostname', '_burst');
	// alter the document

	_.each(Clients, function(value) {
		var tab = _.find(value.internal.tabs, query);
		if (tab) {
			uid = tab.user;
		}
		// find the tab that this change is for

		if (eventName === 'insert') {
			rpcHandler.push(uid, 'newChannelUser', doc);
		} else if (eventName === 'update') {
			rpcHandler.push(uid, 'updateChannelUser', doc);
		} else if (eventName === 'delete') {
			rpcHandler.push(uid, 'deleteChannelUser', doc);
		}
	});
};

/**
 * Handles a new websocket opening and attaches the RPC events
 *
 * @method onSocketOpen
 * @param {Object} socket A valid sock.js socket
 * @return void
 */
RPCHandler.prototype.onSocketOpen = function(socket) {
	// so here we handle incoming websocket connections
	// and then wrap them in our own websocket rpc which handles
	// event binding and such, doing this allows us to quickly
	// switch websocket engines if we ever need to and gives us a standard
	// api which is extendable by people writing modules

	var self = this,
		webSocket = new WebSocket(socket);
	// create the websocket and assign it to Sockets[id]
	// websocket constructor handles event binding etc

	webSocket.on('authenticate', function(data) {
		self.handleAuth(webSocket, data);
	});

	webSocket.on('sendCommand', function(data) {
		self.handleCommand(webSocket, data, false);
	});

	webSocket.on('execCommand', function(data) {
		self.handleCommand(webSocket, data, true);
	});

	webSocket.on('readEvents', function(data) {
		self.handleReadEvents(webSocket, data);
	});

	webSocket.on('selectTab', function(data) {
		self.handleSelectTab(webSocket, data);
	});

	webSocket.on('updateTab', function(data) {
		self.handleUpdateTab(webSocket, data);
	});

	webSocket.on('insertTab', function(data) {
		self.handleInsertTab(webSocket, data);
	});

	webSocket.on('getEvents', function(data) {
		self.handleGetEvents(webSocket, data);
	});

	Sockets[socket.id] = webSocket;
};

/**
 * Handles the authentication command sent to us from websocket clients
 * Authenticates us against login tokens in the user record, disconnects
 * if expired or incorrect.
 *
 * @method handleAuth
 * @param {Object} socket A valid sock.js socket
 * @param {Object} data A valid data object from sock.js
 * @return void
 */
RPCHandler.prototype.handleAuth = function(socket, data) {
	var self = this;
	
	userManager.isAuthenticated(data)
		.fail(function() {
			socket.send('authenticate', false, true);
		})
		.then(function(user) {
			socket._user = user;

			if (!Users[user._id]) {
				Users[user._id] = [{id: socket.id, socket: socket}];
			} else {
				Users[user._id].push({id: socket.id, socket: socket});
			}

			socket.send('authenticate', true, false);

			self.handleConnect(socket);
			// handle sending out data on connect
		});
};

/**
 * Handles new websocket clients, this is only done after
 * they have been authenticated and it's been accepted.
 * 
 * @method handleConnect
 * @param {Object} socket A valid sock.js socket
 * @return void
 */
RPCHandler.prototype.handleConnect = function(socket) {
	var deferred = Q.defer(),
		user = socket._user,
		netIds = {},
		usersQuery = {$or: []},
		commandsQuery = {$or: []};

	if (!helper.exists(user, 'profile.autoCompleteChar')) {
		user.profile.autoCompleteChar = ',';
	}
	// add any missing / default items

	var output = {
		users: [_.omit(user, 'salt', 'password', 'tokens')],
		networks: [],
		tabs: [],
		channelUsers: [],
		events: [],
		commands: [],
		highlights: [],
		burstend: true
	};

	application.Networks.find({'internal.userId': user._id}).toArray(function(err, nets) {
		if (err || !nets) {
			deferred.reject(err);
		} else {
			deferred.resolve(nets);
		}
	});
	// get our networks

	deferred.promise
		.fail(function() {
			socket.sendBurst(output);
		})
		.then(function(nets) {
			var promise = Q.defer();
				output.networks = nets;

			output.networks.forEach(function(network) {
				netIds[network._id] = {
					name: network.name,
					nick: network.nick.toLowerCase()
				};
			});

			application.Tabs.find({user: user._id}).toArray(function(err, dbTabs) {
				promise.resolve(dbTabs);
			});

			return promise.promise;
			// handle network stuff, get tabs and return another promise
		})
		.then(function(dbTabs) {
			var promise = Q.defer();
				output.tabs = dbTabs;

			var tabUrls = _.map(output.tabs, 'url');
			if (tabUrls.indexOf(user.selectedTab) === -1 && output.tabs.length > 0) {
				user.selectedTab = output.tabs[0].url;
			}
			// determine whether we have a selected tab or not?

			if (output.tabs.length === 0) {
				output.channelUsers = [];
				output.commands = [];

				return sendResponse();
			}

			output.tabs.forEach(function(tab, index) {
				var tlower = tab.target.toLowerCase(),
					query;

				usersQuery.$or.push({network: netIds[tab.network].name, channel: tlower});
				commandsQuery.$or.push({network: tab.network, target: tlower});
				// construct some queries

				if (tab.type === 'query') {
					query = {network: netIds[tab.network].name, user: user._id, $or: [{target: tlower}, {'message.nickname': new RegExp('(' + helper.escape(tlower) + ')', 'i'), target: netIds[tab.network].nick.toLowerCase()}]};
				} else if (tab.type === 'network') {
					query = {network: netIds[tab.network].name, target: '*', user: user._id};
				} else {
					query = {network: netIds[tab.network].name, target: tlower, user: user._id};
				}

				application.Events.find(query, ['_id', 'extra', 'message', 'network', 'read', 'target', 'type']).sort({'message.time': -1}).limit(50).toArray(function(err, dbEventResults) {
					application.Events.find(_.extend({read: false}, query)).count(function(err, dbUnreadItems) {
						application.Events.find(_.extend({'extra.highlight': true, read: false}, query)).toArray(function(err, dbUnreadHighlights) {
							
							output.events = _.union(output.events, dbEventResults);
							output.highlights = _.union(output.highlights, dbUnreadHighlights);

							tab.unread = dbUnreadItems;
							tab.highlights = dbUnreadHighlights.length;
							// combine the results

							if ((index + 1) === output.tabs.length) {
								promise.resolve();
								return;
							}
						});
					});
				});
				// XXX: I hate doing this, horribly messy. Suggestions on improving?
			});
			// loop tabs

			return promise.promise.then(function() {
				application.ChannelUsers.find(usersQuery, ['nickname', 'network', 'channel', 'sort', 'prefix', '_id']).toArray(function(err, dbUsers) {
					application.Commands.find(_.extend({user: user._id, backlog: true}, commandsQuery)).sort({timestamp: -1}).limit(20).toArray(function(err, dbCommands) {
						output.channelUsers = dbUsers || [];
						output.commands = dbCommands || [];

						sendResponse();
					});
				});
				// get channel users and commands
			});
		});

	function sendResponse() {
		socket.sendBurst(output);
		// send output

		application.Users.update({_id: user._id}, {$set: {lastSeen: new Date(), selectedTab: user.selectedTab}}, {safe: false});
		// update last seen time
	}
};

/**
 * Handles the exec command RPC call. Which should be used to execute /commands
 * from the clientside without inserting them into the backlog.
 *
 * @method handleCommand
 * @param {Object} socket A valid sock.js socket
 * @param {Object} data A valid data object from sock.js
 * @param {Boolean} exec Whether to exec the command or backlog it
 * @return void
 */
RPCHandler.prototype.handleCommand = function(socket, data, exec) {
	var allow = false,
		allowed = ['command', 'network', 'target'],
		command,
		user = socket._user;

	exec = exec || false;
	command = (exec) ? 'execCommand' : 'sendCommand';
	data = data.object;

	if (!data) {
		return socket.send('error', {command: command, error: 'invalid format, see API docs'});
	}

	_.forOwn(data, function(value, item) {
		if ((item === 'command' || item === 'network' || item === 'target') && typeof value === 'string') {
			allow = true;
		}

		if (_.indexOf(allowed, item) === -1) {
			allow = false;
		}
		// invalid key
	});
	
	if (!allow) {
		return socket.send('error', {command: command, error: 'invalid document properties, see API docs'});
	}

	application.Tabs.findOne({network: new mongo.ObjectID(data.network), user: user._id, target: data.target}, function(err, find) {
		if (err || !find) {
			return socket.send('error', {command: command, error: 'not authorised to call this command'});
		}

		data.user = user._id;
		data.timestamp = +new Date();
		data.network = find.network;
		data.backlog = !exec;
		// bail if we can't find the tab, if we can re-set the network value

		application.Commands.insert(data, {safe: false});
		// insert
	});
	// try and find a valid tab
};

/**
 * Handles the command which marks events as read. It takes a MongoDB query and updates
 * them with that query.
 *
 * @method handleReadEvents
 * @param {Object} socket A valid sock.js socket
 * @param {Object} data A valid data object from sock.js
 * @return void
 */
RPCHandler.prototype.handleReadEvents = function(socket, data) {
	var query = data.query,
		object = data.object;

	if (!query || !object) {
		return socket.send('error', {command: 'readEvents', error: 'invalid format, see API docs'});
	}

	console.log('obj is ', object, 'difference is', _.difference(_.keys(object), ['read']).length);
	if (_.difference(_.keys(object), ['read']).length !== 0 && typeof object.read === 'boolean') {
		return socket.send('error', {command: 'readEvents', error: 'invalid document properties, see API docs'});
	}

	if (query._id) {
		query._id = new mongo.ObjectID(query._id);
	}
	// update it to a proper mongo id

	if ('$in' in query) {
		_.each(query.$in, function(q, i) {
			query.$in[i] = new mongo.ObjectID(q);
		});

		query = {_id: query};
	}

	if ('$or' in query) {
		_.each(query.$or, function(q, i) {
			var subQuery = q;

			if ('_id' in subQuery) {
				subQuery._id = new mongo.ObjectID(subQuery._id);
				query.$or[i] = subQuery;
			}
		});
	}
	// convert _id to proper mongo IDs
	
	application.Events.update(query, {$set: object}, {multi: true, safe: false});
};

/**
 * Handles the selectTab command which is used to change the currently active tab
 * for that user.
 *
 * @method handleSelectTab
 * @param {Object} socket A valid sock.js socket
 * @param {Object} data A valid data object from sock.js
 * @return void
 */
RPCHandler.prototype.handleSelectTab = function(socket, data) {
	var user = socket._user,
		exists = false,
		url = data.object;

	if (!url) {
		return socket.send('error', {command: 'selectTab', error: 'invalid format, see API docs'});
	}

	_.each(Clients, function(value) {
		if (value.internal.userId.toString() !== user._id.toString()) {
			return;
		}

		if (_.find(value.internal.tabs, {'url': url})) {
			exists = true;
			return false;
		}
	});

	if (!exists) {
		return socket.send('error', {command: 'selectTab', error: 'invalid document properties, see API docs'});
	}

	application.Users.update({_id: user._id}, {$set: {selectedTab: url}}, {safe: false});
};

/**
 * Handles the update tab command, we're allowed to change client side only settings here
 * ``hiddenUsers`` and ``hiddenEvents`` only at the moment.
 *
 * @method handleUpdateTab
 * @param {Object} socket A valid sock.js socket
 * @param {Object} data A valid data object from sock.js
 * @return void
 */
RPCHandler.prototype.handleUpdateTab = function(socket, data) {
	var user = socket._user,
		allow = false,
		allowed = ['hiddenUsers', 'hiddenEvents'],
		tab = data.query;

	data = data.object;

	if (!tab || !data) {
		return socket.send('error', {command: 'updateTab', error: 'invalid format, see API docs'});
	}

	_.forOwn(data, function(value, item) {
		if ((item === 'hiddenUsers' || item == 'hiddenEvents') && typeof value === 'boolean') {
			allow = true;
		}
		// check the values?

		if (_.indexOf(allowed, item) === -1) {
			allow = false;
		}
		// invalid key
	});

	if (!allow) {
		return socket.send('error', {command: 'updateTab', error: 'invalid document properties, see API docs'});
	}

	tab = new mongo.ObjectID(tab);
	// update it to a proper mongo id

	application.Tabs.update({_id: tab, user: user._id}, {$set: data}, {safe: false});
	// update
};

/**
 * Allows users to create new tabs on the fly from the client side. Restricted to ``channel`` and ``query`` tabs.
 *
 * @method handleInsertTab
 * @param {Object} socket A valid sock.js socket
 * @param {Object} data A valid data object from sock.js
 * @return void
 */
RPCHandler.prototype.handleInsertTab = function(socket, data) {
	var user = socket._user,
		allow = false,
		allowed = ['target', 'network', 'selected'];

	data = data.object;

	if (!data) {
		return socket.send('error', {command: 'insertTab', error: 'invalid format, see API docs'});
	}

	_.forOwn(data, function(value, item) {
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

	if (!allow) {
		return socket.send('error', {command: 'insertTab', error: 'invalid document properties, see API docs'});
	}

	var nid = new mongo.ObjectID(data.network),
		ircClient = Clients[nid];
		data.target = decodeURIComponent(data.target);

	if (ircClient && ircClient.internal.userId.toString() === user._id.toString()) {
		var type = (helper.isChannel(ircClient, data.target)) ? 'channel' : 'query';

		if (type === 'channel') {
			ircFactory.send(ircClient._id, 'join', [data.target]);
		} else {
			networkManager.addTab(ircClient, data.target, type, data.selected);
		}
	}
	// we're allowed to continue, use network manager to add the tab
};

/**
 * Handles queries to the events collection
 *
 * @method handleGetEvents
 * @param {Object} socket A valid sock.js socket
 * @param {Object} data A valid data object from sock.js
 * @return void
 */
RPCHandler.prototype.handleGetEvents = function(socket, data) {
	var user = socket._user,
		query = data.query,
		limit = data.object || 50;

	if (!query) {
		return socket.send('error', {command: 'getEvents', error: 'invalid format, see API docs'});
	}

	if (limit > 50) {
		limit = 50;
	}
	// reset back to 50

	if (query._id) {
		_.each(query._id, function(_id, op) {
			_id = query._id[op];
			
			if (_id) {
				query._id[op] = new mongo.ObjectID(_id);
			}
		});
	}
	// convert _id to proper mongo IDs

	application.Events.find(_.extend({user: user._id}, data.query), ['_id', 'extra', 'message', 'network', 'read', 'target', 'type']).sort({'message.time': -1}).limit(limit).toArray(function(err, response) {
		if (err || !response) {
			socket.send('events', []);
		} else {
			socket.send('events', response);
		}


	});
	// perform the query 
};

RPCHandler.prototype = _.extend(RPCHandler.prototype, hooks);

exports.RPCHandler = RPCHandler;
