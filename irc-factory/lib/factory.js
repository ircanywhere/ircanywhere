/*
	factory.js - Node JS IRC client factory

	(C) Copyright Ricki Hastings 2013
		https://github.com/ircanywhere/node-irc

	This library is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This library is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this library.  If not, see <http://www.gnu.org/licenses/>.
*/

var arguments = process.argv.splice(2),
	config = require('../../' + arguments[0]),
	winston = require('winston'),
	domain = require('domain'),
	fqueue = require('function-queue')(),
	util = require('util'),
	crypto = require('crypto'),
	net = require('net'),
	ipem = require('ipevents'),
	irc = require('./irc'),
	d = domain.create(),
	identDaemon = 0,
	clientPool = {},
	stack = [],
	delay = 0;

winston.loggers.add('error', 
{
	file: {
		filename: '../../logs/factory.error.log',
		dirname: __dirname + '/../../logs',
		timestamp: true,
		json: false,
		maxsize: 1048576
	}
});

var error_logger = winston.loggers.get('error');
	error_logger.remove(winston.transports.Console);

/*
 * Handle any caught errors
 */
d.on('error', function(err)
{
	var actualError = '';
	if (typeof err != 'object')
	{
		error_logger.error(err);
		actualError = err;
	}
	// error isnt an object just dump it to file

	if (err.stack)
	{
		error_logger.error(err.stack);
		actualError = err.stack;
	}
	else if (err.message)
	{
		error_logger.error(err.message);
		actualError = err.message;
	}
	// no stack trace exists, save err.message
});

/*
 * An inter process event emitter which handles the RPC functions
 */
d.run(function()
{
	config.factory.socket.onlyConnect = false;
	// override this

	var pingTimers = {},
		timeoutTimers = {};

	ipem
		.options(config.factory)
		.on('pong', function()
		{
			clearTimeout(timeoutTimers[this.from]);
			// clear any old timers
		})
		.on('identd connected', function(pid)
		{
			identDaemon = pid;
		})
		.on('register ident', function(local, remote, uid)
		{
			ipem.sendTo([identDaemon], 'register ident', local, remote, uid);
		})
		.on('remove ident', function(local, remote, uid)
		{
			ipem.sendTo([identDaemon], 'remove ident', uid);
		})
		.on('online', function()
		{
			var _this = this;

			if (this.pids.length <= 1)
				return;

			ipem.sendTo([_this.from], 'connected', _this.from, ipem.pid);
			ipem.sendTo([_this.from], 'identd connected', identDaemon);
			// also relay out anything else any other processes need, in this case "identd connected"

			clearInterval(pingTimers[_this.from]);
			// clear any old timers

			pingTimers[_this.from] = setInterval(function()
			{
				ipem.sendTo([_this.from], 'ping', +new Date());
				timeoutTimers[_this.from] = setTimeout(function()
				{
					ipem.disconnect([_this.from]);
					// reconnect here
				}, 10000);
				// wait 10 seconds, if no reply, reconnect

			}, 60000);
			// create a new one
		})
		.on('offline', function()
		{
			clearInterval(pingTimers[this.from]);
			// clear any old timers
		})
		.on('create', function(keyObject)
		{
			var _this = this;
			
			fqueue.push(function(callback)
			{
				if (typeof keyObject != 'object' || keyObject == null || (keyObject != null && (keyObject.object == undefined || keyObject.key == undefined)))
					return false;
				// invalid key object

				var key = keyObject.key;
					clientPool[key] = new irc.Client(keyObject.object);
				// setup anf irc client

				clientPool[key].queue = [];
				clientPool[key].process = [_this.from];
				// set some variables

				clientPool[key].events.onAny(function()
				{
					if (stack.length > 10)
						stack.pop();
					// pop the first element

					stack.push({key: key, event: this.event, args: arguments});
					// push to the queue stack

					if (clientPool[key] != undefined)
						ipem.sendTo(clientPool[key].process, 'irc', key, this.event, arguments);
					// send it under one event, so we can easily monitor it elsewhere
				});

				clientPool[key].events.on('close', function()
				{
					ipem.sendTo([_this.from], 'closed', key, false);
					// emit an event to tell any processes that a connection has been closed
				});

				clientPool[key].events.on('timeout', function()
				{
					if (clientPool[key] != undefined && typeof clientPool[key].connect == 'function')
						clientPool[key].connect();
					// reconnect

					ipem.sendTo([_this.from], 'closed', key, true);
					// emit an event to tell any processes that a connection has been closed
					// the last value is true in this case which indicates a timeout
				});

				clientPool[key].events.on('abort', function()
				{
					if (clientPool[key] == undefined)
						return false;
					// invalid client

					clientPool[key].destroy(function()
					{
						clientPool[key] = null;
						delete clientPool[key];
						// null the socket and remove it from the client pool

						ipem.sendTo([this.from], 'closed', key, false);
						ipem.sendTo([_this.from], 'failed', key);
						// connection failed, not being throttled just failed to connect the
						// maximum number of times so let's just sack it off.
					});
				});

				clientPool[key].events.on('registered', function()
				{
					ipem.sendTo([_this.from], 'created', keyObject);
					// send created when we know the client has actually registered and irc is working
					// not just an open socket, or a command to say the socket is open
				});
				// bind events to it

				setTimeout(function() {
					callback();
				}, 1000);
				// wait 1 second before attempting to connect a new client
			});
		})
		.on('destroy', function(key)
		{
			if (clientPool[key] == undefined)
				return false;
			// invalid key, send an error

			clientPool[key].destroy(function()
			{
				clientPool[key] = null;
				delete clientPool[key];
				// null the socket and remove it from the client pool

				ipem.sendTo([this.from], 'closed', key, false);
				ipem.sendTo([this.from], 'destroyed', key);
			});
		})
		.on('validate', function(key)
		{
			ipem.sendTo([this.from], 'validate', key, (!(clientPool[key] == undefined)));
			// validate key
		})
		.on('initial validate', function(keyObject)
		{
			if (typeof keyObject != 'object' || (keyObject.object == undefined || keyObject.key == undefined))
				return false;
			// invalid key object

			if (clientPool[keyObject.key] != undefined)
				clientPool[keyObject.key].process = [this.from];

			ipem.sendTo([this.from], 'initial validate', keyObject, (!(clientPool[keyObject.key] == undefined)));
			// validate key

			if (clientPool[keyObject.key] == undefined)
				return;

			clientPool[keyObject.key].ping();
			// ping to check if the connection is alive, if it isn't we'll
			// know within 30 seconds and the timeout event will be emitted

			for (var i in clientPool[keyObject.key].queue)
			{
				var item = clientPool[keyObject.key].queue[i];
				
				ipem.sendTo([this.from], 'irc', item.key, item.event, item.args);
				// send any queued items down

				delete item;
			}
		})
		.on('rpc', function(key, command, args)
		{
			if (clientPool[key] == undefined)
				return false;
			// invalid key, send an error

			if (clientPool[key][command] == undefined)
				return false;
			// invalid command

			clientPool[key][command].apply(clientPool[key], args);
			// we execute this, however we don't get a callback
		})
		.on('error', function(error)
		{
			if (new RegExp('Can not push to [0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\:[0-9]{1,5}\: Process not found.', 'i').test(error.message))
			{
				var item = stack[stack.length - 1];

				if (item !== undefined && clientPool[item.key] !== undefined)
					clientPool[item.key].queue.push(item);
				// get last item and push it to the queue
			}
			// cant push to a certain process
		})
		.start();
});
// run this in the domain