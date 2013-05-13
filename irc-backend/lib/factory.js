/* ============================================================
 * IRCAnywhere Confidential
 * ============================================================
 * 
 * (C) Copyright 2011 - 2012 IRCAnywhere (https://ircanywhere.com)
 * All Rights Reserved.
 * 
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE.txt', which is part of this source code package.
 *
 * ============================================================ */

var crypto = require('crypto'),
	server = require('./server').Server,
	defconf = server.config,
	system = require('./system').System;

exports.Factory = {};
exports.Factory.ipem = require('ipevents');
exports.Factory.keys = {};
exports.Factory.tempKeys = {};

/*
 * Factory::setup
 *
 * Setup factory
 */
exports.Factory.setup = function()
{
	var bnc = require('./bnc').BNC,
		ircHandler = require('./irc_handler').IrcHandler,
		_this = this;

	_this.ipem
		.options(defconf.factory)
		.on('connected', function()
		{
			if (typeof _this.keys != 'object')
				return;

			_this.lock(false);

			for (var i in _this.keys)
				_this.ipem.sendToGrandMaster('initial validate', _this.keys[i]);
		})
		.on('offline', function()
		{
			if (this.pids.indexOf(this.parent) == -1)
				_this.lock(true);
		})
		.on('initial validate', function(keyObject, valid)
		{
			if (valid === true)
			{
				_this.keys[keyObject.key] = keyObject;
				// we have a key, lets store it

				bnc.setSocketKey(keyObject.account, keyObject.network, keyObject.key);
				bnc.setNetworkStatus(keyObject.account, keyObject.network, 'connected', {socket_key: keyObject.key});
				// we've got a valid key, update the database

				system.networkLog(keyObject.account, keyObject.network, 're-initiated connection to ' + keyObject.object.server + ':' + keyObject.object.port);
				// log it
			}
			else
			{
				_this.destroy(keyObject.key);
				_this.ipem.sendToGrandMaster('create', keyObject);
				// we dont have a valid key, request to create a new client

				system.networkLog(keyObject.account, keyObject.network, 'successfully connected to ' + keyObject.object.server + ':' + keyObject.object.port);
				// log this action
			}

			_this.restartTimeout(keyObject.account, keyObject.network);
		})
		.on('destroyed', function(key)
		{
			delete _this.keys[key];
			delete _this.tempKeys[key];
			// remove our keys
		})
		.on('created', function(keyObject, socket)
		{
			_this.keys[keyObject.key] = keyObject;
			delete _this.tempKeys[keyObject.key];
			// remove the temp key and reassign the normal one
		})
		.on('closed', function(key, timeout)
		{
			var keyObject = _this.keys[key];

			if (keyObject === undefined)
				return;

			var status = (server.client_data[keyObject.account].networks[keyObject.network].status === 'disconnected') ? 'disconnected' : 'closed';
			bnc.setNetworkStatus(keyObject.account, keyObject.network, status);
			// it appears we've either timed out or the sockets been closed, update the status
			// factory will take care of a reconnection if its a timeout or anything else
		})
		.on('failed', function(key)
		{
			var keyObject = _this.keys[key];

			if (keyObject === undefined)
				return;

			bnc.setNetworkStatus(keyObject.account, keyObject.network, 'failed');
			// connection has completely failed, this means the factory has aborted it
			// usually this is from an invalid connection or a down ircd. We attempt to
			// retry however many times we tell the factory to in the irc object (10)
			// if it fails on all 10 attempts it brings us back here.

			system.networkLog(keyObject.account, keyObject.network, 'FAILED to connected to ' + keyObject.object.server + ':' + keyObject.object.port);
			// log this action
		})
		.on('irc', function(key, e, args)
		{
			if (_this.keys[key] == undefined && _this.tempKeys[key] == undefined)
				return;
			// alert

			var keyObject = _this.keys[key] || _this.tempKeys[key];

			if (keyObject === undefined)
				return;

			if (e == 'socketinfo')
			{
				if (typeof args[0] === 'object' && args[0].port !== undefined && keyObject.object !== undefined && keyObject.object.port !== undefined)
				{
					var uid = server.client_data[keyObject.account].networks[keyObject.network].ident;
						uid = (uid == null) ? keyObject.object.userName : uid;

					_this.ipem.broadcast('register ident', args[0].port, keyObject.object.port, uid);
					// register the ident
				}
				// do some checking here, we don't want any crashes.
			}
			// if the event is socketinfo, nothing to do with irc really, just the connection
			// handle it here.
			else
			{
				ircHandler.handleEvents(keyObject.account, keyObject.network, e, args);
			}
			// handle all irc events
		})
		.on('ping', function()
		{
			_this.ipem.sendTo([this.from], 'pong');
		})
		.on('error', function(error)
		{
			
		})
		.start();
};

/*
 * Factory::hash
 *
 * Generate a hash from an account and network
 */
exports.Factory.hash = function(account, network)
{
	var	key = crypto.createHash('md5').update(account + '-' + network).digest('hex');
	// hash it

	return key;
};

/*
 * Factory::send
 *
 * A function to send data to a cliient
 */
exports.Factory.send = function(key, command, args)
{
	var _this = this;

	_this.ipem.sendToGrandMaster('rpc', key, command, args);
	// send the rpc command
};

/*
 * Factory::destroy
 *
 * A function to destroy a client in the factory
 */
exports.Factory.destroy = function(key)
{
	var _this = this;
	
	_this.ipem.sendToGrandMaster('destroy', key);
	// send the command
};

/*
 * Factory::create
 *
 * A function to create a new irc client from the irc factory
 */
exports.Factory.create = function(account, network, ircObject)
{
	var _this = this,
		key = _this.hash(account, network);

	_this.tempKeys[key] = {
		key: key,
		object: ircObject,
		account: account,
		network: network
	};
	// store a temp key

	_this.ipem.sendToGrandMaster('initial validate', _this.tempKeys[key]);
	// call initial validate, this will let us know whether we have a real object or not

	return key;
};

/*
 * Factory::lock
 *
 * A function to lock the system down if the factory is offline, we'll just "make" it look like
 * the socket server is offline by just disconnecting everyone, they'll attempt to reconnect
 * soon, hopefully the irc factory will be back online then.
 */
exports.Factory.lock = function(status)
{
	var _this = this;

	if (_this.closed == status)
		return;

	_this.closed = status;
	// set a variable indicating its closed

	server.io.sockets.emit('factory status', {offline: status});
};

/*
 * Factory::restartTimeout
 *
 * This restarts the disconnect timeout if the user is on a plan which is limited by a timeout
 * it's called in multiple places, login, on send and on start.
 */
exports.Factory.restartTimeout = function(account, net)
{
	var _this = this,
		user = server.client_data[account],
		network = user.networks[net];

	if (user.account_type !== undefined && typeof user.account_type === 'object')
	{
		var timeout = (user.account_type.timeout === undefined) ? 0 : user.account_type.timeout;

		if (timeout === 0)
		{
			return false;
		}
		// timeout is zero which means there isnt one, lets leave.

		clearTimeout(network.disconnect_timer);

		network.disconnect_timer = setTimeout(function()
		{
			if (network.socket_key === undefined || network.socket_key === 'undefined')
				return false;

			server.client_data[account]['networks'][net].status = 'disconnected';
			// set this as disconnected to mark it initially
			
			_this.destroy(network.socket_key);

		}, timeout);
		// re set a new timeout
	}
	// check the type is defined and proper, not taking any risks anymore
	// this code will NOT crash. Lol
};
