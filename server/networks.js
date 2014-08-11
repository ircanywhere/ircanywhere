/**
 * IRCAnywhere server/networks.js
 *
 * @title NetworkManager
 * @copyright (c) 2013-2014 http://ircanywhere.com
 * @license GPL v2
 * @author Ricki Hastings
*/

var _ = require('lodash'),
	hooks = require('hooks'),
	mongo = require('mongodb'),
	helper = require('../lib/helpers').Helpers,
	Q = require('q');

/**
 * Responsible for handling everything related to networks, such as tracking changes
 * removing, creating, changing tabs, creating and deleting networks etc.
 *
 * @class NetworkManager
 * @method NetworkManager
 * @return void
 */
function NetworkManager() {
	var self = this;

	application.ee.on('ready', self.init.bind(self));
	// run this.init when we get the go ahead
}

/**
 * @member {Object} flags An object containing the valid network statuses
 */
NetworkManager.prototype.flags = {
	connected: 'connected',
	disconnected: 'disconnected',
	connecting: 'connecting',
	closed: 'closed',
	failed: 'failed'
}
	
/**
 * Called when the application is ready to proceed, this sets up event listeners
 * for changes on networks and tabs collections and updates the Client object with the changes
 * to essentially keep the object in sync with the collection so we can do fast lookups, but
 * writes to the collection will propogate through and update Clients
 *
 * @method init
 * @return void
 */
NetworkManager.prototype.init = function() {
	var self = this,
		networks = application.Networks.find(),
		tabs = application.Tabs.find();

	networks.each(function(err, doc) {
		if (err || doc == null) {
			return;
		}
		// error

		var id = doc._id.toString();
		if (!doc.internal) {
			return;
		}

		Clients[id] = doc;
		Clients[id].internal.tabs = {};
	});
	// load up networks and push them into Clients

	tabs.each(function(err, doc) {
		if (err || doc == null) {
			return;
		}
		// error

		var client = Clients[doc.network.toString()];
		if (!client || !client.internal) {
			return;
		}

		client.internal.tabs[doc.target] = doc;
	});

	application.ee.on(['networks', 'insert'], function(doc) {
		var id = doc._id.toString();
		if (!doc.internal) {
			return false;
		}

		Clients[id] = doc;
		Clients[id].internal.tabs = {};
		// update internal records
	});

	application.ee.on(['networks', 'update'], function(doc) {
		var id = doc._id.toString();
		
		Clients[id] = doc;
		Clients[id].internal.tabs = {};
		
		application.Tabs.find({user: doc.internal.userId, network: doc._id}).each(function(err, tab) {
			if (err || tab == null) {
				return;
			}
			// error
			Clients[id].internal.tabs[tab.target] = tab;
		});
	});

	application.ee.on(['networks', 'delete'], function(id) {
		delete Clients[id.toString()];
	});
	// just sync clients up to this, instead of manually doing it
	// we're asking for problems that way doing it this way means
	// this object will be identical to the network list
	// this method is inspired by meteor's observe capabilities

	application.ee.on(['tabs', 'insert'], function(doc) {
		Clients[doc.network.toString()].internal.tabs[doc.target] = doc;
	});

	application.ee.on(['tabs', 'update'], function(doc) {
		Clients[doc.network.toString()].internal.tabs[doc.target] = doc;
	});
	// sync Tabs to client.internal.tabs so we can do quick lookups when entering events
	// instead of querying each time which is very inefficient
	// - the delete is handled in sockets.js after we've propogated it

	application.app.post('/api/addnetwork', function(req, res) {
		self.addNetworkApi(req, res).then(function(response) {
			res.header('Content-Type', 'application/json');
			res.end(JSON.stringify(response));
		});
	});

	application.app.post('/api/editnetwork', function(req, res) {
		self.editNetworkApi(req, res).then(function(response) {
			res.header('Content-Type', 'application/json');
			res.end(JSON.stringify(response));
		});
	});
}

/**
 * Gets a list of networks, used by IRCFactory on synchronise
 * to determine who to connect on startup, doesn't ever really need to be called
 * also can be modified with hooks to return more information if needed.
 *
 * @method getClients
 * @return {promise} A promise containing the clients that should be started up
 */
NetworkManager.prototype.getClients = function(keys) {
	var self = this,
		deferred = Q.defer(),
		timeOutDeferred = Q.defer(),
		clients = {},
		inactive = [],
		timeoutDate = new Date(),
		timeout = application.config.clientSettings.activityTimeout;

	if (timeout > 0) {
		timeoutDate.setHours(timeoutDate.getHours() - timeout);
		// alter the timeout date as per configuration

		application.Users.find({lastSeen: {$lt: timeoutDate}}, ['_id']).toArray(function(err, docs) {
			if (err) {
				return;
			}

			var users = [];

			if (docs) {
				for (var doc in docs) {
					users.push(docs[doc]._id.toString());
				}
			}
			// create an array of timed out users

			timeOutDeferred.resolve(users);
		});
	} else {
		timeOutDeferred.resolve([]);
	}

	timeOutDeferred.promise.then(function (timedOutUsers) {
		application.Networks.find().toArray(function(err, networks) {
			if (err || !networks) {
				deferred.reject();
				return;
			}

			networks.forEach(function(network) {
				if (network.internal && network.internal.status !== self.flags.disconnected && _.indexOf(timedOutUsers, network.internal.userId.toString()) === -1) {
					clients[network._id] = network;
				}

				if (_.indexOf(keys, network._id.toString()) === -1) {
					inactive.push(network._id);
				}
			});

			application.Tabs.update({network: {$in: inactive}}, {$set: {active: false}}, {multi: true, safe: false});
			// mark any tabs for x network inactive

			deferred.resolve(clients);
		});
		// here we just mark them for connection by passing them into this.reconnect
	});

	return deferred.promise;
}

/**
 * Gets a list of networks for a user.
 *
 * @method getClientsForUSer
 * @param {String} userId Id of the user
 * @return {promise} A promise that will resolve to the clients for the given user
 */
NetworkManager.prototype.getClientsForUser = function(userId) {
	var deferred = Q.defer();

	application.Networks.find({'internal.userId': userId}).toArray(function (err, networksArray) {
		if (err) {
			deferred.reject(err);
			return;
		}

		deferred.resolve(networksArray);
	});

	return deferred.promise;
};

/**
 * Gets a list of active channels for a user.
 *
 * @method getActiveChannelsForUser
 * @param {String} userId Id of the user
 * @param {String} networkId Id of the network
 * @return {promise} A promise that will resolve to the active channels for the given user
 */
NetworkManager.prototype.getActiveChannelsForUser = function(userId, networkId) {
	var deferred = Q.defer();

	application.Tabs.find({user: userId, network: networkId, active: true, type: 'channel'}).toArray(function (err, tabsArray) {
		if (err) {
			deferred.reject(err);
			return;
		}

		deferred.resolve(tabsArray);
	});

	return deferred.promise;
};

/**
 * Handles the add network api call, basically handling authentication
 * validating the parameters and input, and on success passes the information
 * to `addNetwork()` which handles everything else
 *
 * @method addNetworkApi
 * @param {Object} req A valid request object from express
 * @param {Object} res A valid response object from express
 * @return {Object} An output object for the API call
 */
NetworkManager.prototype.addNetworkApi = function(req, res) {
	var self = this,
		deferred = Q.defer(),
		server = req.param('server', ''),
		secure = req.param('secure', false),
		port = parseInt(req.param('port', '6667')),
		sasl = req.param('sasl', false),
		saslUsername = req.param('saslUsername', ''),
		password = req.param('password', ''),
		nick = req.param('nick', ''),
		name = req.param('name', ''),
		restriction = application.config.clientSettings.networkRestriction,
		escapedRestrictions = [],
		output = {failed: false, errors: []};
	// get our parameters

	userManager.isAuthenticated(req.headers.cookie)
		.fail(function(err) {
			output.failed = true;
			output.errors.push({error: 'Not authenticated'});

			deferred.resolve(output);
		})
		.then(function(user) {
			restriction.forEach(function(item) {
				var regex = helper.escape(item).replace(/\\\*/g, '(.*)');
				escapedRestrictions.push(new RegExp('(' + regex + ')', 'i'));
			});
			// create an array of restrictions

			application.Networks.find({'internal.userId': user._id}).count(function(err, networkCount) {
				server = helper.trimInput(server);
				name = helper.trimInput(name);
				nick = helper.trimInput(nick);

				if (server === '' || nick === '' || name === '') {
					output.errors.push({error: 'The fields server, nick and name are all required'});
				}

				if (!helper.isValidName(name)) {
					output.errors.push({error: 'The name you have entered is too long'});
				}

				if (!helper.isValidNickname(nick)) {
					output.errors.push({error: 'The nickname you have entered is invalid'});
				}

				if (port < 0 || port > 65535) {
					output.errors.push({error: 'The port you have entered is invalid'});
				}

				if (networkCount >= application.config.clientSettings.networkLimit) {
					output.errors.push({error: 'You have reached the maximum network limit of ' + application.config.clientSettings.networkLimit + ' and may not add anymore'});
				}

				var restricted = true;
				_.each(escapedRestrictions, function(item) {
					if (item.test(server)) {
						restricted = false;
					}
				});

				if (restricted) {
					output.errors.push({error: 'There is a restriction inplace limiting your connections to ' + restriction});
				}

				if (output.errors.length > 0) {
					output.failed = true;

					deferred.resolve(output);
					return;
				}
				// any errors?

				var network = {
					server: server,
					secure: (secure == 'true') ? true : false,
					port: port,
					sasl: (sasl == 'true') ? true : false,
					saslUsername: saslUsername,
					password: password,
					nick: nick,
					realname: name
				};

				self.addNetwork(user, network, self.flags.closed)
					.fail(function() {
						output.failed = true;
						output.errors.push({error: 'An error has occured'});
						deferred.resolve(output);
					})
					.then(function(network) {
						self.connectNetwork(network);
						// add network

						deferred.resolve(output);
					});
			});
		});

	return deferred.promise;
}

/**
 * Handles the edit network api call, everything the add network call does
 * except it takes a network ID as a parameter validates the new data.
 * On success it passes to `editNetwork()` which handles the rest.
 *
 * @method editNetworkApi
 * @param {Object} req A valid request object from express
 * @param {Object} res A valid response object from express
 * @return {Object} An output object for the API call
 */
NetworkManager.prototype.editNetworkApi = function(req, res) {
	var self = this,
		deferred = Q.defer(),
		networkId = req.param('networkId', ''),
		server = req.param('server', ''),
		secure = req.param('secure', false),
		port = parseInt(req.param('port', '6667')),
		sasl = req.param('sasl', false),
		saslUsername = req.param('saslUsername', ''),
		password = req.param('password', ''),
		nick = req.param('nick', ''),
		name = req.param('name', ''),
		restriction = application.config.clientSettings.networkRestriction,
		escapedRestrictions = [],
		output = {failed: false, errors: []};
	// get our parameters

	userManager.isAuthenticated(req.headers.cookie)
		.fail(function(err) {
			output.failed = true;
			output.errors.push({error: 'Not authenticated'});

			deferred.resolve(output);
		})
		.then(function(user) {
			restriction.forEach(function(item) {
				var regex = helper.escape(item).replace(/\\\*/g, '(.*)');
				escapedRestrictions.push(new RegExp('(' + regex + ')', 'i'));
			});
			// create an array of restrictions

			application.Networks.findOne({_id: new mongo.ObjectID(networkId)}, function(err, doc) {
				if (err || !doc) {
					output.errors.push({error: 'An error has occured, please contact your system administrator'});
					output.failed = true;

					deferred.resolve(output);
					return;
				}
				// does the network exist?

				server = helper.trimInput(server);
				name = helper.trimInput(name);
				nick = helper.trimInput(nick);

				if (server === '' || nick === '' || name === '') {
					output.errors.push({error: 'The fields server, nick and name are all required'});
				}

				if (!helper.isValidName(name)) {
					output.errors.push({error: 'The name you have entered is too long'});
				}

				if (!helper.isValidNickname(nick)) {
					output.errors.push({error: 'The nickname you have entered is invalid'});
				}

				if (port < 0 || port > 65535) {
					output.errors.push({error: 'The port you have entered is invalid'});
				}

				var restricted = true;
				_.each(escapedRestrictions, function(item) {
					if (item.test(server)) {
						restricted = false;
					}
				});

				if (restricted) {
					output.errors.push({error: 'There is a restriction inplace limiting your connections to ' + restriction});
				}

				if (output.errors.length > 0) {
					output.failed = true;

					deferred.resolve(output);
					return;
				}
				// any errors?

				var network = _.extend(doc, {
					server: server,
					secure: (secure == 'true') ? true : false,
					port: port,
					sasl: (sasl == 'true') ? true : false,
					saslUsername: saslUsername,
					password: password,
					nick: nick,
					realname: name
				});

				self.editNetwork(user, network, self.flags.closed)
					.fail(function() {
						output.failed = true;
						output.errors.push({error: 'An error has occured'});
						deferred.resolve(output);
					})
					.then(function(network) {
						ircFactory.destroy(network._id, true);
		
						setTimeout(function() {
							ircFactory.create(network);
						}, 1000);
						// wait a second before creating the network, sometimes we create a new client before we destroy it
						// not sure how or why this happens.. async >:(

						deferred.resolve(output);
					});
			});
		});

	return deferred.promise;
}

/**
 * Adds a network using the settings specified to the user's set of networks
 * This just adds it to the database and doesn't attempt to start it up.
 *
 * @method addNetwork
 * @param {Object} user A valid user object from the `users` collection
 * @param {Object} network A valid network object to insert
 * @param {String} status A valid network status
 * @return {promise} A promise to determine whether the insert worked or not
 */
NetworkManager.prototype.addNetwork = function(user, network, status) {
	if (!(status in this.flags)) {
		application.logger.log('warn', 'Invalid status flag for NetworkManager.addNetwork()', helper.cleanObjectIds(network));
		return;
	}

	network.name = network.server;
	network.nick = network.nick || user.profile.nickname;
	network.user = user.ident;
	network.secure = network.secure || false;
	network.sasl = network.sasl || false;
	network.saslUsername = (network.saslUsername !== '') ? network.saslUsername : undefined;
	network.password = network.password || null;
	network.capab = true;
	network.url = network.server + ':' + ((network.secure) ? '+' : '') + network.port;
	// because some settings can be omitted, we're going to set them to
	// the hard-coded defaults if they are, ok. We don't need to worry about
	// validating them before hand either because app.js takes care of that.
	// XXX - this looks a bit messy, tidied up at some point? it would be nice
	//		 if simple-schema could automatically cast these, maybe it can with cast: {}

	network.channels = (_.isArray(network.channels)) ? network.channels : [];
	network.internal = {
		capabilities: {},
		nodeId: application.nodeId,
		userId: user._id,
		status: status
	}
	// this stores internal information about the network, it will be available to
	// the client but they wont be able to edit it, it also wont be able to be enforced
	// by the config settings or network settings, it's overwritten every time.

	var self = this,
		deferred = Q.defer();

	application.Networks.find({'internal.userId': new mongo.ObjectID(user._id), url: network.url}).count(function(err, docs) {
		if (err) {
			return;
		}

		if (docs > 0) {
			network.url = network.url + ':' + docs;
		}

		application.Networks.insert(network, function(err, docs) {
			if (err || docs.length == 0) {
				deferred.reject();
				return;
			}

			var doc = docs[0];

			self.addTab(doc, doc.name, 'network', true, false);
			// add the tab

			deferred.resolve(doc);
		});
	});

	return deferred.promise;
	// insert the network. Just doing this will propogate the change directly due to our observe driver
}

/**
 * Edits an existing network, updating the record in the database. We'll inform
 * irc-factory that the network information has changed and perform a reconnect.
 *
 * @method editNetwork
 * @param {Object} user A valid user object from the `users` collection
 * @param {Object} network A valid network object to update
 * @return {promise} A promise to determine whether the insert worked or not
 */
NetworkManager.prototype.editNetwork = function(user, network) {
	var self = this,
		deferred = Q.defer();

	application.Networks.update({'_id': new mongo.ObjectID(network._id)}, _.omit(network, '_id'), {multi: false}, function(err) {
		if (err) {
			deferred.reject();
			return;
		}

		deferred.resolve(network);
	});

	return deferred.promise;
	// update the network. Just doing this will propogate the change directly due to our observe driver
}

/**
 * Adds a tab to the client's (network unique to user) tabs, this can be a
 * channel or a username.
 *
 * @method addTab
 * @param {Object} client A valid client object
 * @param {String} target The name of the tab being created
 * @param {String} type The type of the tab either 'query', 'channel' or 'network'
 * @param {Boolean} [select] Whether to mark the tab as selected or not, defaults to false
 * @param {Boolean} [active] Whether to mark the tab as active or not, defaults to true
 * @return void
 */
NetworkManager.prototype.addTab = function(client, target, type, select, active) {
	var select = (select !== undefined) ? select : false,
		active = (active !== undefined) ? active : true,
		obj = {
			user: client.internal.userId,
			url: (type === 'network') ? client.url : client.url + '/' + target.toLowerCase(),
			network: client._id,
			networkName: client.name,
			target: target.toLowerCase().trim(),
			title: target.trim(),
			type: type,
			active: active
		};

	if (obj.target == '') {
		return false;
	}
	// empty, bolt it

	var callback = function(err, doc) {
		application.Tabs.update({user: client.internal.userId, network: client._id, target: obj.target}, {$set: obj}, {safe: false, upsert: true});
		// insert to db, or update old record
	};

	if (select) {
		application.Users.update({_id: client.internal.userId}, {$set: {selectedTab: obj.url}}, callback);
	} else {
		callback(null, null);
	}
	// are they requesting a new selected tab?
}

/**
 * Changes a tabs activity (not selection) - for example when you're kicked from a channel the tab
 * wont be removed it will be just set to active: false so when you see it in the interface it will appear as
 * (#ircanywhere) instead of #ircanywhere
 * We can omit target and call activeTab(client, false) to set them all to false (such as on disconnect)
 *
 * @method activeTab
 * @param {Object} client A valid client object
 * @param {String} [target] The name of the tab being altered, discard to mark all as active or inactive.
 * @param {Boolean} activate Whether to set the tab as active or not
 * @return void
 */
NetworkManager.prototype.activeTab = function(client, target, activate) {
	if (typeof target !== 'boolean') {
		application.Tabs.update({user: client.internal.userId, network: client._id, target: target.toLowerCase()}, {$set: {active: activate}}, {safe: false});
	} else {
		application.Tabs.update({user: client.internal.userId, network: client._id}, {$set: {active: target}}, {multi: true, safe: false});
	}
	// update the activation flag
}

/**
 * Removes the specified tab, be careful because this doesn't re-select one, you're expected to look
 * for a removed tab, if it's the currently selected one, go back to a different one.
 *
 * @method removeTab
 * @param {Object} client A valid client object
 * @param {String} [target] The name of the tab being altered, discard to remove all.
 * @return void
 */
NetworkManager.prototype.removeTab = function(client, target) {
	// it's now up to the client to re-select the tab when they get a message saying it's been
	// removed, because of Ember's stateful urls, we can just do history.back() and get a reliable switch
	
	if (target) {
		application.Tabs.remove({user: client.internal.userId, network: client._id, target: target.toLowerCase()}, {safe: false});
	} else {
		application.Tabs.remove({user: client.internal.userId, network: client._id}, function(err, doc) {
			application.Networks.remove({_id: client._id}, {safe: false});
		});
	}
	// remove tabs
}

/**
 * Connect the specified network record, should only really be called when creating
 * a new network as IRCFactory will load the client up on startup and then determine
 * whether to connect the network itself based on the options.
 *
 * However, it's also called when it appears that there is no connected client on the
 * /reconnect command (and any other similar commands). We can determine this (sloppy)
 * from checking client.internal.status. If in the case that it does exist, it doesn't
 * matter if this is called really because irc-factory will prevent a re-write if the
 * key is the same. We could consider looking at the response from factory synchronize
 * but it might not yield a good result because of newly created clients since startup.
 *
 * @method connectNetwork
 * @param {Object} network A valid network or client object
 * @return void
 */
NetworkManager.prototype.connectNetwork = function(network) {
	ircFactory.create(network);
}

/**
 * Update the status for a specific network specified by a MongoDB query. The reason for
 * this and not a straight ID is so we can do certain things such as checking if a network
 * is marked as 'disconnected' during the `closed` event to determine whether to keep it as
 * 'disconnected' or mark it as 'closed'. So we can do much more elaborate queries here than
 * just ID checking
 *
 * @method changeStatus
 * @param {Object} query A MongoDB query to select a network
 * @param {Boolean} status A valid network status
 * @return void
 */
NetworkManager.prototype.changeStatus = function(query, status) {
	if (!(status in this.flags)) {
		application.logger.log('warn', 'Invalid status flag for NetworkManager.changeStatus()', helper.cleanObjectIds({flag: status, network: query}));
		return;
	}

	application.Networks.update(query, {$set: {'internal.status': status}}, {safe: false});
}

NetworkManager.prototype = _.extend(NetworkManager.prototype, hooks);

exports.NetworkManager = NetworkManager;
