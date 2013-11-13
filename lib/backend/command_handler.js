/* ============================================================
 * IRCAnywhere
 * ============================================================
 * 
 * (C) Copyright 2011 - 2012 IRCAnywhere (https://ircanywhere.com)
 * All Rights Reserved.
 * 
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE.txt', which is part of this source code package.
 *
 * ============================================================ */

const crypto = require('crypto'),
	  assert = require('assert');

exports.CommandHandler = {};

var server = require('./server').Server,
	system = require('./system').System,
	stats = require('./stats').Stats,
	database = require('./database').Database,
	bufferEngine = require('./buffer_engine').BufferEngine,
	ircHandler = require('./irc_handler').IrcHandler,
	bnc = require('./bnc').BNC,
	factory = require('./factory').Factory;

/*
 * CommandHandler::isLoggedIn
 *
 * Determine whether a user is logged in from the socket information.
 */
exports.CommandHandler.isLoggedIn = function(socket)
{
	var _this = this,
		username = socket.username,
		client = server.client_data[username];

	if (client == undefined || !client.logged_in)
	{
		socket.disconnect();
		return null;
	}

	return username;
	// new algorithm as last one was fucked big time.
};

/*
 * CommandHandler::validateData
 *
 * Validate the data from the 'add-network' form
 */
exports.CommandHandler.validateData = function(data)
{
	var reqError = true
		error = [];

	if (data['server-hostname'] == '' || data['server-hostname'] === undefined)
		error.push('Server hostname is a required field.');
	if (data['server-port'] == '' || data['server-port'] === undefined)
		error.push('Server port is a required field.');
	if (data['server-nickname'] == '' || data['server-nickname'] === undefined)
		error.push('Nickname is a required field.');
	if (data['server-realname'] == '' || data['server-realname'] === undefined)
		error.push('Realname is a required field.');
	// check for required field

	if (error.length > 0)
		return {error: reqError, errorMsg: error};
	// we have errors send it off

	if (!data['server-hostname'].match(/^(([a-z0-9]|[a-z0-9][a-z0-9\-]{0,61}[a-z0-9])\.)+([a-z0-9]{1,5})$/i))
		error.push('Server hostname is not a valid domain name.');
	if (isNaN(data['server-port']) || (data['server-port'] > 65535 || data['server-port'] < 1))
		error.push('Server port is not a valid port.');
	if (!data['server-nickname'].match(/[a-z_\-\[\]\\^{}|`][a-z0-9_\-\[\]\\^{}|`]*/i))
		error.push('Nickname contains invalid characters.');
	// check for valid data (ie no spaces etc)

	if (error.length == 0)
		reqError = false;

	return {error: reqError, errorMsg: error};
};

/*
 * CommandHandler::disconnect
 *
 * Handles disconnecting clients
 */
exports.CommandHandler.disconnect = function(socket)
{
	var _this = this;

	for (key in server.client_data)
	{
		var client = server.client_data[key],
			active = false;

		if (client.ip != socket.handshake.address.address)
			continue;

		for (network in client['networks'])
		{
			if (client['networks'][network].status == 'connected')
			{
				active = true;
				server.client_data[key]['networks'][network].send('send', ['AWAY', 'Disconnected from client']);
				// away the client

				factory.restartTimeout(key, network);
				// restart the inactivity timeout
			}
		}

		system.isActive(key, active);
		server.client_data[key].is_connected = active;
		// here we determine if the user is still active, if they are connected to any networks?
		// if they arnt, we tell the stateDaemon that it isn't

		database.userModel.update({account: key}, {is_connected: active}, function(err) {});
		// update users data model & emit the data back
		
		stats.sessions.logouts++;
		var sockets = server.client_data[key].sockets.length;
		for (var si in server.client_data[key].sockets)
		{
			if (server.client_data[key].sockets[si] === socket)
			{
				server.client_data[key].sockets[si] = null;
				sockets--;
			}
		}
		// find the socket and delete it

		if (sockets == 0)
		{
			server.client_data[key].sockets.length = 0;
			server.client_data[key].logged_in = false;
			stats.sessions.active--;
		}
		// set logged in to false only if there are no sockets available
	}
	// mark any clients as away
};

/*
 * CommandHandler::changeTab
 *
 * Handles the 'changeTab' event 
 */
exports.CommandHandler.changeTab = function(socket, data)
{
	var _this = this;
		data.tab = (data.tab == null) ? '' : data.tab;

	if ((key = _this.isLoggedIn(socket)) === null)
		return;
	// determine whether we're logged in

	if (data.tab == undefined || data.active == undefined)
	{
		server.emit(server.client_data[key], 'error', {'error_type': 'CHANGETAB', 'error': 'Invalid syntax'});
		return;
	}
	// syntax check

	server.client_data[key].tab = data.tab;
	server.client_data[key].active = data.active;
	// update the user

	database.userModel.update({account: key}, {tab: data.tab}, function(err) {});
	// update users data model & emit the data back
};

/*
 * CommandHandler::login
 *
 * Handles the 'login' command (now 'login' emit event) 
 */
exports.CommandHandler.login = function(socket, data)
{
	var _this = this,
		user = data.account,
		session_id = data.session_id,
		networks = {};
	
	if (data.account == undefined || data.session_id == undefined)
	{
		server.emit(server.client_data[user], 'error', {'error_type': 'LOGIN', 'error': 'Invalid syntax'});
		return socket.disconnect();
	}
	// syntax check

	database.userModel.findOne({account: user, session_id: session_id}, function (err, row)
	{
		if (err || row == null || factory.closed || row == null || (row.node != system._id && row.node != null))
		{
			return socket.disconnect();
			// user is marked as connecting, force a disconnect
		}
		else if (row.suspended)
		{
			socket.emit('error', {'error_type': 'WS_CLOSE', 'error': 'Your account is currently suspended, for more information contact <a href="mailto:support@ircanywhere.com">support@ircanywhere.com</a>.'}, function(data)
			{
				if (data == 'recieved')
					socket.disconnect();
			});
			// user is suspended
		}
		else
		{
			return bnc.handleLogin(socket, user, row, data);
			// handle the login
		}
	});
	// user found, check the pass, if pass is fine then let's roll!
};

/*
 * CommandHandler::addNetwork
 *
 * Handles the 'connect' command (now 'addNetwork' emit event) 
 */
exports.CommandHandler.addNetwork = function(socket, data)
{
	var _this = this,
		errorData = _this.validateData(data);

	if ((key = _this.isLoggedIn(socket)) === null)
		return;
	// determine whether we're logged in

	if (errorData.error)
	{
		server.emit(server.client_data[key], 'error', {'error_type': 'ADD', 'error': errorData.errorMsg});
		return;
	}
	// syntax check
	
	var networkRecord = new database.networkModel(),
		networkName = networkRecord._id,
		secure = (data['server-secure'] == undefined) ? false : true,
		port = (secure) ? '+' + data['server-port'] : data['server-port'],
		url = data['server-hostname'] + ':' + port,
		connectedTo = 0,
		exists = 0,
		autojoin = {},
		connect_commands = [];
	// do some housekeeping

	for (var network in server.client_data[key]['networks'])
	{
		if (server.client_data[key]['networks'][network].status == 'connected')
			connectedTo++;

		if (server.client_data[key]['networks'][network].url.toLowerCase() == url.toLowerCase())
		{
			exists++;
			url = data['server-hostname'] + ':' + port + ':' + exists;
		}
		// figure out if any networks with the same url exist
	}
	// how many networks are we connected to?
	// also look for some other things

	if (data['autojoin-chans'] != undefined && data['autojoin-chans'] != '')
	{
		var channels = data['autojoin-chans'].split('\r\n');

		for (var chan in channels)
		{
			var split = channels[chan].split(' '),
				channel = split[0],
				password = split[1] || '';

			autojoin[channel] = password;
		}
		// generate a channel object from the textarea input

		autojoin = ircHandler.encodeChans(autojoin);
		// encode the channel object for storage
	}
	// handle the list of autojoin channels for storage

	if (data['connect-commands'] != undefined && data['connect-commands'] != '')
	{
		var commands = data['connect-commands'].split('\r\n');

		for (var command in commands)
		{
			connect_commands.push(commands[command]);
		}
	}
	// handle the list of on connect commands

	networkRecord.name = data['server-hostname'];
	networkRecord.host = data['server-hostname'];
	networkRecord.port = data['server-port'];
	networkRecord.url = url;
	networkRecord.password = data['server-password'];
	networkRecord.secure = secure;
	networkRecord.sasl = (data['server-sasl'] == undefined) ? false : true;
	networkRecord.nick = data['server-nickname'];
	networkRecord.ident = server.client_data[key].ident;
	networkRecord.real = data['server-realname'];
	networkRecord.user = key;
	networkRecord.ip = socket.handshake.address.address;
	networkRecord.status = 'disconnected';
	networkRecord.locked = false;
	networkRecord.chans = {};
	networkRecord.extra = {};
	networkRecord.autojoin_chans = autojoin;
	networkRecord.connect_commands = connect_commands;

	networkRecord.save(function(err)
	{
		if (err)
		{
			server.emit(server.client_data[key], 'addNetwork', {success: false, netName: networkName});
			return system.log.error(err);
		}

		database.networkModel.findOne({_id: networkName}, function(err, row)
		{
			server.client_data[key]['networks'][networkName] = row;
			bnc.setSocketKey(key, networkName, 'undefined');
			// re set some things

			var networkArray = [],
				tabId = server.generateTabId(networkName, 'window');

			for (var net in server.client_data[key]['networks'])
				networkArray.push(net);

			database.userModel.update({account: key}, {networks: networkArray}, function(err) {});
			server.emit(server.client_data[key], 'addNetwork', {
				success: true,
				tabId: tabId,
				netName: networkName,
				network: server.returnUI(server.client_data[key]['networks'][networkName])
			});
		});
		// quickly update the client_data array with our new networkRecord, then output the data
	});
	// insert the network
};

/*
 * CommandHandler::removeNetwork
 *
 * Handles the 'QUIT' command (now 'removeNetwork' emit event) 
 */
exports.CommandHandler.removeNetwork = function(socket, data)
{
	var _this = this;

	if ((key = _this.isLoggedIn(socket)) === null)
		return;
	// determine whether we're logged in

	if (data.network === undefined)
	{
		server.emit(server.client_data[key], 'error', {'error_type': 'REMOVE', 'error': 'Invalid syntax'});
		return;
	}

	if (server.client_data[key]['networks'][data.network] == undefined)
	{
		server.emit(server.client_data[key], 'error', {'error_type': 'REMOVE', 'error': 'Invalid network'});
		return;
	}
	// check if the network exists

	var accType = server.client_data[key].account_type;
	if (!accType.canRemove && server.client_data[key]['networks'][data.network].locked)
	{
		server.emit(server.client_data[key], 'error', {'error_type': 'REMOVE', 'error': 'This network is locked and you cannot remove it.'});
		return;
	}
	// determine if this network is restricted or not.

	system.networkLog(key, data.network, 'deleting bouncer connection to ' + server.client_data[key]['networks'][data.network].host + ':' + server.client_data[key]['networks'][data.network].port);
	// log it.

	if (server.client_data[key]['networks'][data.network] === undefined ||
		server.client_data[key]['networks'][data.network].socket_key !== undefined ||
		server.client_data[key]['networks'][data.network].socket_key !== 'undefined')
		factory.destroy(server.client_data[key]['networks'][data.network].socket_key);
	
	delete server.client_data[key]['networks'][data.network];
	// delete the client and that.

	var active = false,
		networkIds = [];
	
	for (network in server.client_data[key]['networks'])
	{
		if (server.client_data[key]['networks'][network].status == 'connected')
			active = true;

		networkIds.push(network);
	}

	system.isActive(key, active);
	server.client_data[key].is_connected = active;
	// determine whether to mark this user as inactive

	database.userModel.update({account: key}, {is_connected: active, networks: networkIds}, function(err) {});
	database.networkModel.find({_id: data.network}).remove();
	// update in database
	database.bufferModel.find({network: database.mongoose.Types.ObjectId(data.network)}).remove();
	// delete buffers (they've already been warned)
},

/*
 * CommandHandler::updateNetwork
 *
 * Handles the 'updateNetwork' emit event 
 */
exports.CommandHandler.updateNetwork = function(socket, data)
{
	var _this = this,
		errorData = _this.validateData(data);

	if ((key = _this.isLoggedIn(socket)) === null)
		return;
	// determine whether we're logged in

	if (errorData.error)
	{
		server.emit(server.client_data[key], 'error', {'error_type': 'UPDATE', 'error': errorData.errorMsg});
		return;
	}
	// syntax check

	var accType = server.client_data[key].account_type,
		networkName = data.networkId,
		tabId = server.generateTabId(data.network, 'window'),
		autojoin = {},
		connect_commands = [],
		reconnnect = false;
	
	if ((!accType.canRemove && server.client_data[key]['networks'][networkName].locked) || (data['server-hostname'] !== server.client_data[key]['networks'][networkName].host))
	{
		server.emit(server.client_data[key], 'error', {'error_type': 'UPDATE', 'error': 'The connection settings for this network is locked, upgrade to remove this limitation.'});
		return;
	}
	// determine if this network is restricted or not.
	// only things that are non editable are the hostname and port.

	if (data['server-hostname'] !== server.client_data[key]['networks'][networkName].host || data['server-port'] !== server.client_data[key]['networks'][networkName].port || data['server-secure'] !== server.client_data[key]['networks'][networkName].secure)
	{
		if (server.client_data[key]['networks'][networkName] === undefined ||
			server.client_data[key]['networks'][networkName].socket_key !== undefined ||
			server.client_data[key]['networks'][networkName].socket_key !== 'undefined')
		{
			reconnect = true;
			factory.destroy(server.client_data[key]['networks'][networkName].socket_key);
		}
		// disconnect the client if it exists
	}

	if (data['autojoin-chans'] != undefined && data['autojoin-chans'] != '')
	{
		var channels = data['autojoin-chans'].split('\r\n');

		for (var chan in channels)
		{
			var split = channels[chan].split(' '),
				channel = split[0],
				password = split[1] || '';

			autojoin[channel] = password;
		}
		// generate a channel object from the textarea input

		autojoin = ircHandler.encodeChans(autojoin);
		// encode the channel object for storage
	}
	// handle the list of autojoin channels for storage

	if (data['connect-commands'] != undefined && data['connect-commands'] != '')
	{
		var commands = data['connect-commands'].split('\r\n');

		for (var command in commands)
		{
			connect_commands.push(commands[command]);
		}
	}
	// handle the list of on connect commands

	server.client_data[key]['networks'][networkName].name = data['server-hostname'];
	server.client_data[key]['networks'][networkName].host = data['server-hostname'];
	server.client_data[key]['networks'][networkName].port = data['server-port'];
	server.client_data[key]['networks'][networkName].password = data['server-password'];
	server.client_data[key]['networks'][networkName].secure = (data['server-secure'] == undefined) ? false : true;
	server.client_data[key]['networks'][networkName].sasl = (data['server-sasl'] == undefined) ? false : true;
	server.client_data[key]['networks'][networkName].nick = data['server-nickname'];
	server.client_data[key]['networks'][networkName].real = data['server-realname'];
	server.client_data[key]['networks'][networkName].autojoin_chans = autojoin;
	server.client_data[key]['networks'][networkName].connect_commands = connect_commands;
	// update self.client_data

	system.networkLog(key, networkName, 'updating connection ' + data['server-hostname'] + ':' + data['server-port'] + ', reconnecting');
	// log it.

	server.emit(server.client_data[key], 'updateNetwork', {
		netName: networkName,
		tabId: tabId,
		network: server.returnUI(server.client_data[key]['networks'][networkName])
	});
	
	database.networkModel.update({_id: networkName}, {
		name: server.client_data[key]['networks'][networkName].name,
		host: server.client_data[key]['networks'][networkName].host,
		port: server.client_data[key]['networks'][networkName].port,
		password: server.client_data[key]['networks'][networkName].password,
		secure: server.client_data[key]['networks'][networkName].secure,
		sasl: server.client_data[key]['networks'][networkName].sasl,
		nick: server.client_data[key]['networks'][networkName].nick,
		real: server.client_data[key]['networks'][networkName].real,
		autojoin_chans: server.client_data[key]['networks'][networkName].autojoin_chans,
		connect_commands: server.client_data[key]['networks'][networkName].connect_commands,
		connected: false
	}, function(err) {});
	// update users data model & emit the data back

	if (reconnect)
		bnc.connectIRCClient(key, networkName);
};

/*
 * CommandHandler::connectNetwork
 *
 * Handles 'connectNetwork' emit event
 */
exports.CommandHandler.connectNetwork = function(socket, data)
{
	var _this = this;

	if ((key = _this.isLoggedIn(socket)) === null)
		return;
	// determine whether we're logged in

	if (data.network === undefined)
	{
		server.emit(server.client_data[key], 'error', {'network': data.network, 'error_type': 'CONNECT', 'error': 'Invalid syntax'});
		return;
	}

	if (server.client_data[key]['networks'][data.network] == undefined)
	{
		server.emit(server.client_data[key], 'error', {'network': data.network, 'error_type': 'CONNECT', 'error': 'Invalid network'});
		return;
	}
	// check if the network exists

	if (server.client_data[key]['networks'][data.network].status == 'connected')
	{
		server.emit(server.client_data[key], 'error', {'network': data.network, 'error_type': 'CONNECT', 'error': 'You are already connected to ' + server.client_data[key]['networks'][data.network].host + ':' + server.client_data[key]['networks'][data.network].port + '.'});
		return;
	}
	// check if network is already connected

	if (!bnc.allowedNewConnection(key))
	{
		server.emit(server.client_data[key], 'error', {'network': data.network, 'error_type': 'CONNECT', 'error': 'You are already connected to the maximum number of networks on your plan.'});
		return;
	}
	// check if we are allowed to.

	var netinfo = server.client_data[key]['networks'][data.network];
	bnc.connectIRCClient(key, data.network);
};

/*
 * CommandHandler::disconnectNetwork
 *
 * Handles 'disconnectNetwork' emit event
 */
exports.CommandHandler.disconnectNetwork = function(socket, data)
{
	var _this = this;

	if ((key = _this.isLoggedIn(socket)) === null)
		return;
	// determine whether we're logged in

	if (data.network === undefined)
	{
		server.emit(server.client_data[key], 'error', {'network': data.network, 'error_type': 'DISCONNECT', 'error': 'Invalid syntax'});
		return;
	}

	if (server.client_data[key]['networks'][data.network] == undefined)
	{
		server.emit(server.client_data[key], 'error', {'network': data.network, 'error_type': 'DISCONNECT', 'error': 'Invalid network'});
		return;
	}
	// check if the network exists

	if (server.client_data[key] != undefined && server.client_data[key]['networks'][data.network] != undefined)
	{
		server.client_data[key]['networks'][data.network].status = 'disconnected';
		// mark the status as disconnected here to determine whether we want to keep it as
		// disconnected or mark it as closed later on
		
		if (server.client_data[key]['networks'][data.network].socket_key !== undefined ||
			server.client_data[key]['networks'][data.network].socket_key !== 'undefined')
			factory.destroy(server.client_data[key]['networks'][data.network].socket_key);
		// disconnect the client if it exists
	}
	// stop doing all this elaborate marking users as disconnected here
	// the ircHandler.handleExit does that, so it all happens in one place, rather
	// than like 2 or 3. BYE MESSY CODE
};

/*
 * CommandHandler::getChanList
 *
 * Handles the 'getChanList' command
 */
exports.CommandHandler.getChanList = function(socket, data)
{
	var _this = this;

	if ((key = _this.isLoggedIn(socket)) === null)
		return;
	// determine whether we're logged in

	if (data.network === undefined)
	{
		server.emit(server.client_data[key], 'error', {'error_type': 'GETCHANLIST', 'error': 'Invalid syntax'});
		return;
	}
	// error checking

	if (server.client_data[key]['networks'][data.network] == undefined)
	{
		server.emit(server.client_data[key], 'error', {'network': data.network, 'error_type': 'GETCHANLIST', 'error': 'Invalid network'});
		return;
	}
	// check if the network exists

	if (server.client_data[key]['networks'][data.network].extra.lchannels >= 500)
	{
		server.emit(server.client_data[key], 'error', {'network': data.network, 'error_type': 'GETCHANLIST', 'error': 'Channel list is too large to retrieve.'});
		return;
	}
	// too many channels
	else
	{
		server.emit(server.client_data[key], 'chanlistStart', {
			network: data.network,
			tabId: server.generateTabId(data.network, 'other-list')
		});
		
		server.client_data[key]['networks'][data.network].send('list', []);
	}
	// send the list command to the server
};

/*
 * CommandHandler::getUnreadNum
 *
 * Handles the 'getUnreadNum' command
 */
exports.CommandHandler.getUnreadNum = function(socket, data)
{
	var _this = this;

	if ((key = _this.isLoggedIn(socket)) === null)
		return;
	// determine whether we're logged in

	if (data.network === undefined || data.target === undefined)
	{
		server.emit(server.client_data[key], 'error', {'error_type': 'GETLOGS', 'error': 'Invalid syntax'});
		return;
	}
	// error checking

	if (server.client_data[key]['networks'][data.network].status != 'connected')
	{
		server.emit(server.client_data[key], 'error', {'error_type': 'GETLOGS', 'error': 'Not connected'});
		return;
	}
	// check if we're connected

	database.logModel.count({account: key, network: data.network, target: data.target.toLowerCase().toLowerCase(), read: false}, function(err, count)
	{
		var type = (ircHandler.isChannel(key, network, data.target)) ? 'chan' : 'query',
			tabId = server.generateTabId(key, type, data.target);

		server.emit(server.client_data[key], 'unreadNum', {
			network: data.network,
			target: data.target,
			tabId: tabId,
			num: count
		});
	});
};

/*
 * CommandHandler::getLogs
 *
 * Handles the 'getBacklog' command
 */
exports.CommandHandler.getBacklog = function(socket, data)
{
	var _this = this;

	if ((key = _this.isLoggedIn(socket)) === null)
		return;
	// determine whether we're logged in

	if (data.network === undefined || data.id === undefined || data.status === undefined || data.target === undefined)
	{
		server.emit(server.client_data[key], 'error', {'error_type': 'GETBACKLOG', 'error': 'Invalid syntax'});
		return;
	}
	// error checking

	if (data.status != true && server.client_data[key]['networks'][data.network].status != 'connected')
	{
		server.emit(server.client_data[key], 'error', {'error_type': 'GETBACKLOG', 'error': 'Not connected'});
		return;
	}
	// check if we're connected

	var update = {'$or': []},
		limit = data.limit || 100;

	if (data.status)
	{
		var query = {
			account: key,
			network: data.network,
			target: data.target.toLowerCase(),
			status: true
		};
	}
	else
	{
		if (data.from == undefined)
		{
			var query = {
				account: key,
				network: data.network,
				target: data.target.toLowerCase(),
				status: false
			};
			// create a query object if the from isn't specified
		}
		else 
		{
			var query = {
				account: key,
				network: data.network,
				'$or': [{
					target: data.target.toLowerCase(),
					nick: data.from.toLowerCase()
				}, {
					target: data.from.toLowerCase(),
					nick: data.target.toLowerCase()
				}],
				status: false
			};
			// create a query object if the from is specified
		}
		// if the status is defined as false do that then.
	}

	if (data.id != null || data.btmId != null)
		query['_id'] = {};

	if (data.id != null)
		query['_id']['$lt'] = data.id;
	
	if (data.btmId != null)
		query['_id']['$lt'] = data.btmId;
	// if the id doesn't equal null, we do a $lt: id

	bufferEngine.getMoreBacklog(socket, key, data, query);
	// let bnc handle this, gets quite hefty
},

/*
 * CommandHandler::markRead
 *
 * Handles the markRead event
 */
exports.CommandHandler.markRead = function(socket, data)
{
	var _this = this;

	if ((key = _this.isLoggedIn(socket)) === null)
		return;
	// determine whether we're logged in

	if (data.network === undefined || data.privmsg === undefined || data.status === undefined)
	{
		server.emit(server.client_data[key], 'error', {'error_type': 'MARKREAD', 'error': 'Invalid syntax'});
		return;
	}
	// error checking

	if (server.client_data[key]['networks'][data.network] !== undefined && server.client_data[key]['networks'][data.network].status !== 'connected')
	{
		server.emit(server.client_data[key], 'error', {'error_type': 'MARKREAD', 'error': 'Not connected'});
		return;
	}
	// check if we're connected

	if (data.from == undefined)
	{
		var query = {
			account: key,
			network: data.network,
			read: false,
			status: data.status,
			privmsg: data.privmsg
		};
		// create a query object if the from isn't specified
	}
	else if (data.from !== undefined && data.target !== undefined)
	{
		var query = {
			account: key,
			network: data.network,
			'$or': [{
				target: data.target.toLowerCase(),
				nick: data.from.toLowerCase()
			}, {
				target: data.from.toLowerCase(),
				nick: data.target.toLowerCase()
			}],
			read: false,
			status: data.status,
			privmsg: data.privmsg
		};
		// create a query object if the from is specified
	}

	if (data.from == undefined && data.target !== undefined)
	{
		query.target = data.target.toLowerCase();
	}

	if (data.ids != undefined && data.ids.length > 0)
	{
		if (query['$or'] == undefined)
			query['$or'] = [];

		for (i = 0; i < data.ids.length; i++)
			query['$or'].push({_id: data.ids[i]});
	}
	// if ids is defined then generate a query string

	database.bufferModel.update(query, {read: true}, {multi: true}, function(err, num) {});
},

/*
 * CommandHandler::send
 *
 * Handles the 'SEND' command (now 'send' emit event)
 */
exports.CommandHandler.send = function(socket, data)
{
	var _this = this;

	if ((key = _this.isLoggedIn(socket)) === null)
		return;
	// determine whether we're logged in

	if (data.network === undefined || data.command === undefined)
	{
		server.emit(server.client_data[key], 'error', {'error_type': 'SEND', 'error': 'Invalid syntax'});
		return;
	}
	// syntax check
	
	if (server.client_data[key]['networks'][data.network].status != 'connected')
	{
		server.emit(server.client_data[key], 'error', {'error_type': 'SEND', 'error': 'Not connected'});
		return;
	}
	// is the user connected to network?

	ircHandler.sendLine(key, data.network, data.command, socket);
	// send the line

	factory.restartTimeout(key, data.network);
	// last but not least reset their activity timer
};