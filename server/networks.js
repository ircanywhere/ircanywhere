var _ = require('lodash'),
	hooks = require('hooks'),
	mongo = require('mongodb'),
	helper = require('../lib/helpers').Helpers;

/**
 * Responsible for handling everything related to networks, such as tracking changes
 * removing, creating, changing tabs, creating and deleting networks etc.
 *
 * @class	NetworkManager
 * @method 	NetworkManager
 * @extend	false
 * @return 	void
 */
function NetworkManager() {
	var self = this;

	this.flags = {
		connected: 'connected',
		disconnected: 'disconnected',
		connecting: 'connecting',
		closed: 'closed',
		failed: 'failed'
	};

	application.ee.on('ready', function() {
		fibrous.run(self.init.bind(self));
	});
	// run this.init when we get the go ahead
}
	
/**
 * Called when the application is ready to proceed, this sets up event listeners
 * for changes on networks and tabs collections and updates the Client object with the changes
 * to essentially keep the object in sync with the collection so we can do fast lookups, but
 * writes to the collection will propogate through and update Clients
 *
 * @method 	init
 * @extend 	true
 * @return 	void
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

		Clients[doc.network.toString()].internal.tabs[doc.target] = doc;
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

	application.ee.on(['networks', 'delete'], function(doc, id) {
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

	application.ee.on(['tabs', 'delete'], function(doc, id) {
		_.each(Clients, function(value, key) {
			var tab = _.find(value.internal.tabs, {'_id': id});
			if (tab) {
				delete Clients[key].internal.tabs[tab.target];
			}
		});
	});
	// sync Tabs to client.internal.tabs so we can do quick lookups when entering events
	// instead of querying each time which is very inefficient

	application.app.post('/api/addnetwork', function(req, res) {
		var response = self.addNetworkApi(req, res);

		res.header('Content-Type', 'application/json');
		res.end(JSON.stringify(response));
	});
}

/**
 * Gets a list of networks, used by IRCFactory on synchronise
 * to determine who to connect on startup, doesn't ever really need to be called
 * also can be modified with hooks to return more information if needed.
 *
 * @method 	getClients
 * @extend 	true
 * @return 	{Object}
 */
NetworkManager.prototype.getClients = function() {
	var self = this,
		clients = {},
		networks =  application.Networks.sync.find().sync.toArray();
	// get the networks (we just get all here so we can do more specific tests on whether to connect them)

	networks.forEach(function(network) {
		var reconnect = false;

		if (network.internal && network.internal.status !== self.flags.disconnected) {
			reconnect = true;
		}

		if (reconnect) {
			clients[network._id] = network;
			// add the client into our local cache
		}
	});
	// here we just mark them for connection by passing them into this.reconnect

	return clients;
}

/**
 * Handles the add network api call, basically handling authentication
 * validating the parameters and input, and on success passes the information
 * to `addNetwork()` which handles everything else
 *
 * @method 	getClients
 * @extend 	true
 * @return 	{Object}
 */
NetworkManager.prototype.addNetworkApi = function(req, res) {
	var server = req.param('server', ''),
		secure = req.param('secure', false),
		port = parseInt(req.param('port', '6667')),
		sasl = req.param('sasl', false),
		password = req.param('password', ''),
		nick = req.param('nick', ''),
		name = req.param('name', ''),
		networkCount = 0,
		restriction = (application.config.clientSettings.networkRestriction) ? application.config.clientSettings.networkRestriction : '*',
		user = userManager.isAuthenticated(req.headers.cookie),
		output = {failed: false, errors: []};
	// get our parameters

	if (!user) {
		output.failed = true;
		output.errors.push({error: 'Not authenticated'});
		return output;
	}

	var escapedRestriction = helper.escape(restriction).replace('\\*', '(.*)');
	networkCount = application.Networks.sync.find({'internal.userId': user._id}).sync.count();
	server = helper.trimInput(server);
	name = helper.trimInput(name);
	nick = helper.trimInput(nick);

	if (server === '' || nick === '' || name === '') {
		output.errors.push({error: 'The fields, server, nick and name are all required'});
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

	if (!server.match(new RegExp('(' + escapedRestriction + ')', 'i'))) {
		output.errors.push({error: 'There is a restriction inplace limiting your connections to ' + restriction});
	}

	if (output.errors.length > 0) {
		output.failed = true;
		return output;
	}
	// any errors?

	this.addNetwork(user, {
		server: server,
		secure: (secure == 'true') ? true : false,
		port: port,
		sasl: (sasl == 'true') ? true : false,
		password: password,
		nick: nick,
		realname: name
	}, this.flags.closed);
	// add network

	this.connectNetwork(network);

	return output;
}

/**
 * Adds a network using the settings specified to the user's set of networks
 * This just adds it to the database and doesn't attempt to start it up.
 *
 * @method 	addNetwork
 * @param 	{Object} user
 * @param 	{Object} network
 * @extend 	true
 * @return 	{Object}
 */
NetworkManager.prototype.addNetwork = function(user, network, status) {
	if (!(status in this.flags)) {
		application.logger.log('warn', 'invalid status flag for addNetwork', helper.cleanObjectIds(network));
		return;
	}

	network.name = network.server;
	network.nick = network.nick || user.profile.nickname;
	network.user = user.ident;
	network.secure = network.secure || false;
	network.sasl = network.sasl || false;
	network.saslUsername = network.saslUsername || undefined;
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

	var doc = application.Networks.sync.insert(network)[0];
	
	this.addTab(doc, doc.name, 'network', true, false);
	// add the tab

	return doc;
	// insert the network. Just doing this will propogate the change directly due to our observe driver
}

/**
 * Adds a tab to the client's (network unique to user) tabs, this can be a
 * channel or a username.
 *
 * @method 	addTab
 * @param 	{Object} client
 * @param 	{String} target
 * @param 	{String} type
 * @param 	{Boolean} [optional] select
 * @extend 	true
 * @return 	void
 */
NetworkManager.prototype.addTab = function(client, target, type, select, active) {
	var select = (select !== undefined) ? select : false,
		active = (active !== undefined) ? active : true,
		obj = {
			user: client.internal.userId,
			url: (type === 'network') ? client.url : client.url + '/' + target.toLowerCase(),
			network: client._id,
			networkName: client.name,
			target: target.toLowerCase(),
			title: target,
			type: type,
			selected: select,
			active: active
		};

	if (obj.target.trim() == '') {
		return false;
	}
	// empty, bolt it

	var callback = function(err, doc) {
		if (client.internal.tabs && client.internal.tabs[obj.target]) {
			application.Tabs.update({user: client.internal.userId, network: client._id, target: target}, {$set: {active: active, selected: select}}, function(err, doc) { });
		} else {
			application.Tabs.insert(obj, function(err, doc) { });
		}
		// insert to db, or update old record
	};

	if (select) {
		application.Tabs.update({user: client.internal.userId}, {$set: {selected: false}}, {multi: true}, callback);
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
 * @method 	activeTab
 * @param 	{Object} client
 * @param 	{String} target
 * @param 	{Boolean} [optional] activate
 * @extend 	true
 * @return 	void
 */
NetworkManager.prototype.activeTab = function(client, target, activate) {
	if (typeof target !== 'boolean') {
		application.Tabs.sync.update({user: client.internal.userId, network: client._id, target: target}, {$set: {active: activate}});
	} else {
		application.Tabs.sync.update({user: client.internal.userId, network: client._id}, {$set: {active: target}}, {multi: true});
	}
	// update the activation flag
}

/**
 * Removes the specified tab, be careful because this doesn't re-select one, you're expected to look
 * for a removed tab, if it's the currently selected one, go back to a different one.
 *
 * @method 	removeTab
 * @param 	{Object} client
 * @param 	{String} target
 * @extend 	true
 * @return 	void
 */
NetworkManager.prototype.removeTab = function(client, target) {
	// it's now up to the client to re-select the tab when they get a message saying it's been
	// removed, because of Ember's stateful urls, we can just do history.back() and get a reliable switch
	
	if (target) {
		application.Tabs.sync.remove({user: client.internal.userId, network: client._id, target: target});
	} else {
		application.Tabs.remove({user: client.internal.userId, network: client._id}, function(err, doc) {
			application.Networks.remove({_id: client._id}, function(err, doc) { });
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
 * @method 	connectNetwork
 * @param 	{Object} network
 * @extend 	true
 * @return 	void
 */
NetworkManager.prototype.connectNetwork = function(network) {
	ircFactory.create(network);
}

/**
 * Description
 * @method 	changeStatus
 * @param 	{Object} query
 * @param 	{Boolean} status
 * @extend 	true
 * @return  void
 */
NetworkManager.prototype.changeStatus = function(query, status) {
	if (!(status in this.flags)) {
		application.logger.log('warn', 'invalid status flag for changeStatus', helper.cleanObjectIds({flag: status, network: query}));
		return;
	}

	application.Networks.sync.update(query, {$set: {'internal.status': status}});
}

exports.NetworkManager = _.extend(NetworkManager, hooks);