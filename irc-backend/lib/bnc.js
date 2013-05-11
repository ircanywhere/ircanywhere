
exports.BNC = {};

exports.BNC.queue = require('function-queue')();

var server = require('./server').Server,
	system = require('./system').System,
	stats = require('./stats').Stats,
	database = require('./database').Database,
	bufferEngine = require('./buffer_engine').BufferEngine,
	ircHandler = require('./irc_handler').IrcHandler,
	factory = require('./factory').Factory;

/*
 * BNC::bootBouncers
 * 
 * This is used to boot bouncers up in batch, note bouncers not individual clients
 * Individual clients are handled in src/command_handler.js. This boots up all clients
 * a user may have, takes an array of usernames.
 */
exports.BNC.bootBouncers = function(clients)
{
	"use strict";

	var _this = this;

	system.isActive(clients, true);
	// mark the users as booting up

	database.userModel.find({account: {'$in' : clients}}, function (err, results)
	{
		database.userModel.update({
			account: {'$in' : clients},
			'$or': [
				{status: 'connected'},
				{status: 'connecting'}
			]
		}, {status: 'disconnected'}, {multi: true});
		// mark all as disconnected, we've got their records in results and its not a stream its a direct array
		// so we can determine now what to do with it, ie reconnect / disconnect, etc. this prevents random
		// hangings of clients, nfi whats causing this but something is, ie the database reports 'connected',
		// which means the frontend does and it causes massive amounts of problems for clients.
		// in reality they are not connected an irc client doesnt exist.
		// TODO - work more on stabilising this

		var queuePush = function (callback, object)
		{
			_this.connectBnc(object.result, object.networks);
			// use the object queue, boot bouncers and call a callback which sets the user as active

			callback();
			// next item
		};

		for (var rkey in results)
		{
			if (results.hasOwnProperty(rkey))
			{
				var result = results[rkey];
				_this.queue.push(queuePush, {result: result, networks: result.networks});
			}
		}
	});
};

/*
 * BNC::loadNetworks
 *
 * Load networks from db into the .networks array
 */
exports.BNC.loadNetworks = function(user, networks, callback)
{
	"use strict";

	var _this = this,
		networkQuery = {'_id': {'$in': []}};

	for (var i = 0; i < networks.length; i++)
	{
		networkQuery._id.$in.push(networks[i]);
	}
	// construct a query

	database.networkModel.find(networkQuery).sort({'locked': -1, '_id': 1}).exec(function(nerr, rows)
	{
		server.client_data[user].networks = (server.client_data[user].networks === undefined) ? {} : server.client_data[user].networks;

		for (var nrow in rows)
		{
			if (rows.hasOwnProperty(nrow))
			{
				var net = rows[nrow]._id;

				for (var chan in rows[nrow].chans)
				{
					if (rows[nrow].chans.hasOwnProperty(chan))
					{
						var decode = new Buffer(chan, 'base64').toString('ascii'),
							password = rows[nrow].chans[chan];

						rows[nrow].chans[decode] = password;
						delete rows[nrow].chans[chan];
					}
				}
				// decode channels

				for (var chan in rows[nrow].autojoin_chans)
				{
					if (rows[nrow].autojoin_chans.hasOwnProperty(chan))
					{
						var decode = new Buffer(chan, 'base64').toString('ascii'),
							password = rows[nrow].autojoin_chans[chan];

						rows[nrow].autojoin_chans[decode] = password;
						delete rows[nrow].autojoin_chans[chan];
					}
				}
				// decode auto join channels
				
				if (server.client_data[user].networks[net] !== undefined && server.client_data[user].networks[net].timer !== undefined)
					clearTimeout(server.client_data[user].networks[net].timer);
				
				if (server.client_data[user].networks[net] !== undefined && server.client_data[user].networks[net].disconnect_timer !== undefined)
					clearTimeout(server.client_data[user].networks[net].disconnect_timer);
				// clear timers

				server.client_data[user].networks[net] = rows[nrow];
				server.client_data[user].networks[net].forcedNickChange = false;
				// reset the network array

				var extra = server.client_data[user].networks[net].extra,
					skey = server.client_data[user].networks[net].socket_key;
				
				skey = (skey !== undefined && skey !== 'undefined') ? skey : 'undefined';
				extra = ircHandler.splitCapabilities(extra);
				// set extra

				_this.setSocketKey(user, net, skey);
				// reset the socket key if we need to
			}
		}

		callback();
	});
	// dump the networks
};

/*
 * BNC::connectBnc
 *
 * A function to reconnect a new bnc client from database
 */
exports.BNC.connectBnc = function(result, networks)
{
	"use strict";

	var _this = this,
		last = last || null;

	if (server.client_data[result.account] === undefined)
	{
		server.client_data[result.account] = {};

		for (var key in result)
		{
			if (key !== 'networks')
			{
				server.client_data[result.account][key] = result[key];
			}
		}
		
		server.client_data[result.account].sockets = [];
		server.client_data[result.account].networks = {};
		server.client_data[result.account].timezone = '+02';
		server.client_data[result.account].ip = null;
		server.client_data[result.account].logged_in = false;
		server.client_data[result.account].account_type = (result.account_type === undefined) ? server.accountTypes[server.defaultAccType] : server.accountTypes[result.account_type];
		server.client_data[result.account].highlight_words = (result.highlight_words.trim() === '') ? [] : result.highlight_words.trim().split(' ');
	}
	// setup client data

	_this.loadNetworks(result.account, networks, function()
	{
		for (var network in server.client_data[result.account].networks)
		{
			if (server.client_data[result.account].networks.hasOwnProperty(network))
			{
				var object = server.client_data[result.account].networks[network];

				if (_this.allowedNewConnection(result.account) && object.status !== 'disconnected' && object.status !== 'closed')
				{
					_this.connectIRCClient(result.account, network);
				}
				// connect it up
			}
		}

		server.client_data[result.account].is_connected = true;
		var regex = '(';
		for (var word in server.client_data[result.account].highlight_words)
		{
			if (server.client_data[result.account].highlight_words.hasOwnProperty(word))
			{
				regex += bufferEngine.escape(server.client_data[result.account].highlight_words[word]) + '|';
			}
		}

		server.client_data[result.account].highlight_regex = regex;
		// construct the highlight regex
		// TODO - Implement a refresh function for the frontend to refresh the backends settings for a user
		//        things like ident, account_type, highlight_words, etc.
	});
	// set the networks array up
};

/*
 * BNC::connectIRCclient
 *
 * Handle the connection of an irc client
 */
exports.BNC.connectIRCClient = function(user, network)
{
	"use strict";

	var _this = this,
		object = server.client_data[user].networks[network],
		ident = (object.ident === undefined || object.ident === '') ? server.client_data[user].ident : object.ident,
		chans = [];

	for (var chan in server.client_data[user]['networks'][network].chans)
	{
		chans.push(chan + ' ' + server.client_data[user]['networks'][network].chans[chan]);
	}	
	// create chans object

	var skey = factory.create(user, network, {
		hostname: system.config.hostname,
		server: object.host,
		nick: object.nick,
		userName: ident,
		realName: object.real,
		port: object.port,
		debug: false,
		showErrors: true,
		autoRejoin: false,
		autoConnect: true,
		retryCount: 10,
		retryDelay: 5000,
		channels: chans,
		secure: object.secure,
		selfSigned: true,
		certExpired: true,
		floodProtection: false,
		stripColors: false,
		channelPrefixes: '&#',
		messageSplit: 512,
		password: (object.password === '') ? null : object.password
		//sasl: object.sasl
	});

	server.client_data[user].networks[network].socket_key = skey;
	_this.setSocketKey(user, network, skey);
	// set the socket key

	_this.setNetworkStatus(user, network, 'connecting', {ident: ident, socket_key: skey});
	// update network status

	var clients = 0;
	for (var key in server.client_data)
	{
		if (server.client_data.hasOwnProperty(key))
		{
			clients += Object.keys(server.client_data[key].networks).length;
		}
	}

	stats.maxClients = (clients > stats.maxClients) ? clients : stats.maxClients;
	// calculate how many bouncers there are and determine if we have a new max
};

/*
 * BNC::handleLogin
 *
 * Handle the actual login task, seeing as it's quite hefty and needs to be called in two circumstances
 */
exports.BNC.handleLogin = function(socket, user, row, data)
{
	"use strict";

	var _this = this;

	server.client_data[user] = (server.client_data[user] === undefined) ? {} : server.client_data[user];
	// create an object if it doesn't exist

	var ip = (socket.handshake.address === undefined) ? '0.0.0.0' : socket.handshake.address.address,
		currentUsers = Object.keys(server.client_data).length,
		currentHour = new Date().getHours();
		currentHour = (currentHour < 10) ? '0' + currentHour : currentHour; 
	
	stats.maxUsers = (currentUsers > stats.maxUsers) ? currentUsers : stats.maxUsers;
	stats.sessions.logins++;
	stats.sessions.active++;

	_this.loadNetworks(user, row.networks, function()
	{
		socket.username = user;
		
		for (var key in row)
		{
			if (key !== 'networks')
			{
				server.client_data[user][key] = row[key];
			}
		}

		server.client_data[user].sockets = (server.client_data[user].sockets === undefined) ? [] : server.client_data[user].sockets;
		server.client_data[user].sockets.push(socket);
		server.client_data[user].active = true;
		server.client_data[user].ip = ip;
		server.client_data[user].logged_in = true;
		server.client_data[user].account_type = (row.account_type === undefined) ? server.accountTypes[server.defaultAccType] : server.accountTypes[row.account_type];
		server.client_data[user].highlight_words = (row.highlight_words.trim() === '') ? [] : row.highlight_words.trim().split(' ');
		// set the user as logged in

		var regex = '(';
		for (var word in server.client_data[user].highlight_words)
		{
			if (server.client_data[user].highlight_words.hasOwnProperty(word))
			{
				regex += bufferEngine.escape(server.client_data[user].highlight_words[word]) + '|';
			}
		}
		
		server.client_data[user].highlight_regex = regex;
		// construct the highlight regex
		// TODO - Implement a refresh function for the frontend to refresh the backends settings for a user
		//        things like ident, account_type, highlight_words, etc.

		database.userModel.update({account: user}, {is_connected: true, ip: ip, node: system._id}, function(err) {});
		// update our database

		server.emit(socket, 'userinfo', server.returnUI(server.client_data[user]), true);
		server.emit(socket, 'networks', server.returnUI(server.client_data[user].networks), true);
		// update the info and spit it back to the client

		for (var key in server.client_data[user].networks)
		{
			if (server.client_data[user].networks.hasOwnProperty(key))
			{
				var network = server.client_data[user].networks[key];

				factory.restartTimeout(user, key);
				bufferEngine.getStatusBacklog(socket, user, key);
				// return the status backlog and restart their timer

				if (network.status === 'connected')
				{
					_this.outputToChans(socket, user, key, network);
					// deal with onconnect channels

					server.client_data[user].networks[key].send('send', ['AWAY']);
					// we're connected, send AWAY to server

					if (server.client_data[user].tab !== '' || server.client_data[user].tab !== null || server.client_data[user].tab !== undefined)
					{
						server.emit(socket, 'changeTab', {tab: server.client_data[user].tab}, true);
					}
					// send current tab
				}
				else if (_this.allowedNewConnection(user) && (network.status === 'closed' || network.status === 'disconnected'))
				{
					_this.connectIRCClient(user, key);
				}
				else
				{
					if (server.client_data[user].tab !== '' || server.client_data[user].tab !== null || server.client_data[user].tab !== undefined)
					{
						server.emit(socket, 'changeTab', {tab: server.client_data[user].tab}, true);
					}
					// send current tab
				}
			}
		}
		// loop through networks and mark us as not away and return the logs
	});
};

/*
 * BNC::outputToChans
 *
 * Code to be executed when a new channel is reconnected to, sends an updated userlist, topic, modes etc.
 */
exports.BNC.outputToChans = function(socket, user, key, network)
{
	"use strict";

	for (var chan in network.chans)
	{
		if (network.chans.hasOwnProperty(chan))
		{
			if (ircHandler.channels[network.name] !== undefined && 
				ircHandler.channels[network.name][chan] !== undefined)
			{
				var chanList = ircHandler.channels[network.name][chan].users,
					modes = ircHandler.channels[network.name][chan].modes,
					topic = ircHandler.channels[network.name][chan].topic,
					tabId = server.generateTabId(key, 'chan', chan);

				server.emit(socket, 'channelUpdate', {
					network: key,
					chan: chan,
					tabId: tabId,
					modes: modes,
					topic: topic,
					users: []
				}, true);
				
				server.emit(socket, 'userlist', {
					network: key,
					chan: chan,
					tabId: tabId,
					list: chanList
				}, true);
			}
			else
			{
				server.client_data[user].networks[key].send('send', ['TOPIC', chan]);
				server.client_data[user].networks[key].send('send', ['MODE', chan]);
				server.client_data[user].networks[key].send('send', ['WHO', chan]);
			}
			// send out the user list we have in memory, OR request a new one if we can't find it
		}
	}
};

/*
 * BNC::allowedNewConnection
 *
 * A function to determine if a bnc is allowed a new connection
 */
exports.BNC.allowedNewConnection = function(key)
{
	"use strict";

	var accType = server.client_data[key].account_type,
		connectedTo = 0,
		locked = 0;

	for (var network in server.client_data[key].networks)
	{
		if (server.client_data[key].networks[network].status === 'connected' || server.client_data[key].networks[network].status === 'connecting')
		{
			if (server.client_data[key].networks[network].locked)
			{
				locked++;
			}
			else
			{
				connectedTo++;
			}
		}
	}
	// how many networks are we connected to?

	if ((locked > 0 && accType.locked) && (connectedTo > 1 && accType.locked) || (!accType.locked && connectedTo > accType.networks))
	{
		return false;
	}
	else
	{
		return true;
	}
};

/*
 * BNC::setNetworkStatus
 *
 * Set a networks status completely, update the object and the database, emit the event
 *
 * Extra: can be used to save multiple database calls if stuff is being saved already
 */
exports.BNC.setNetworkStatus = function(user, network, status, extra)
{
	"use strict";

	if (server.client_data[user].networks[network] === undefined)
		return false;
	// stop crashes on deleting network

	server.client_data[user].networks[network].status = status;
	server.emit(server.client_data[user], 'networkStatus', {
		network: network,
		tabId: server.generateTabId(network, 'window'),
		status: status
	});
	// emit the data back

	var query = {status: status};
	for (var attrname in extra)
	{
		if (extra.hasOwnProperty(attrname))
		{
			query[attrname] = extra[attrname];
		}
	}
	// combine extra with query. This saves us two database calls, cause in some places where we use this
	// code, and update the database, we can send the update query into this function which will add it
	// to the properties to be updated. Not 100% clean but alright I guess.

	database.networkModel.update({_id: network}, query, function(err, num)
	{
		if (err)
		{
			system.log.error(err);
		}
	});
	// update users data model & emit the data back
};

/*
 * BNC::setSocketKey
 *
 * Set a send method with the correct socket key
 */
exports.BNC.setSocketKey = function(user, network, socket_key)
{
	server.client_data[user].networks[network].socket_key = socket_key;
	server.client_data[user].networks[network].send = function(command, args)
	{
		if (server.client_data[user].networks[network] === undefined ||
			server.client_data[user].networks[network].socket_key === undefined || 
			server.client_data[user].networks[network].socket_key === 'undefined')
			return false;

		factory.send(server.client_data[user].networks[network].socket_key, command, args);
	};
};