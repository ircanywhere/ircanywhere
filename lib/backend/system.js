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

exports.System = {};
exports.System._id = null;
exports.System.config = {};

exports.System.log = {
	error: function() {}
};

var cronJob = require('cron').CronJob,
	winston = require('winston'),
	factory = require('./factory').Factory,
	server = require('./server').Server,
	defconf = server.config,
	stats = require('./stats').Stats,
	database = require('./database').Database,
	bufferEngine = require('./buffer_engine').BufferEngine,
	bnc = require('./bnc').BNC;

/*
 * System::runTasks
 *
 * Run boot up tasks, basically assign our id from the database, mark it as online and online since
 * And boot up a logging client.
 */
exports.System.runTasks = function()
{
	this.config = {
		hostname: defconf.hostname,
		endpoint: defconf.endpoint,
		port: defconf.port,
	}

	var _this = this,
		query = _this.config;
		query.port = query.port.toString();

	_this.setupWinston();
	// setup winston and handle events

	factory.setup();
	// setup the irc connection factory

	_this.bufferCleanupJob = new cronJob('0 0 * * *', function()
	{
		bufferEngine.removeExpiredMessages();
	});
	// set the buffer cleanup cron job (every night at 00:00)
	
	database.nodeModel.findOneAndUpdate(query, {running: true, bootTime: new Date()}, function(err, row)
	{
		if (err != null || row == null)
			throw new Error('No node found in the database for settings specified, please check configuration file');
		// throw an error

		_this._id = row._id.toString();
		callback();
	});
	// so some database checking

	function callback()
	{
		var clients = [];
		database.userModel.find({node: _this._id}).sort({'time': 1}).exec(function (err, results)
		{
			for (var key in results)
				clients.push(results[key].account);

			bnc.bootBouncers(clients);
		});
		// start booting our bouncers
	}
};

/*
 * System::setupWinston
 *
 * Setup winston and all our transports.
 */
exports.System.setupWinston = function()
{
	var _this = this;
		_this.loggers = {};
		_this.log = {};

	winston.loggers.add('info', 
	{
		file: {
			filename: '../../logs/backend.info.log',
			dirname: __dirname + '/../../logs',
			timestamp: true,
			json: false,
			maxsize: 1048576
		}
	});

	winston.loggers.add('error', 
	{
		file: {
			filename: '../../logs/backend.error.log',
			dirname: __dirname + '/../../logs',
			timestamp: true,
			json: false,
			maxsize: 1048576
		}
	});

	winston.loggers.add('socket',
	{
		file: {
			filename: '../../logs/backend.socket.log',
			dirname: __dirname + '/../../logs',
			timestamp: true,
			json: false,
			maxsize: 1048576
		}
	});
	// setup multiple logger instances

	_this.loggers.info = winston.loggers.get('info');
	_this.loggers.info.remove(winston.transports.Console);

	_this.loggers.error = winston.loggers.get('error');
	_this.loggers.error.remove(winston.transports.Console);

	_this.loggers.socket = winston.loggers.get('socket');
	_this.loggers.socket.remove(winston.transports.Console);
	// setup the individual logging instances cause we want seperate files

	_this.log.info = _this.loggers.info.info;
	// info method is just a direct proxy

	_this.log.error = function(err)
	{
		var actualError = '';
		if (typeof err != 'object')
		{
			_this.loggers.error.error(err);
			actualError = err;
		}
		// error isnt an object just dump it to file

		if (err.stack)
		{
			_this.loggers.error.error(err.stack);
			actualError = err.stack;
		}
		else if (err.message)
		{
			_this.loggers.error.error(err.message);
			actualError = err.message;
		}
		// no stack trace exists, save err.message
	};
	// the error catching one is more sophisticated

	_this.loggers.info.on('error', werror);
	_this.loggers.error.on('error', werror);
	_this.loggers.socket.on('error', werror);
	// handle errors

	function werror(err)
	{
		console.log(err);
	};
	// handle winston errors through console
};

/*
 * System::isActive
 *
 * Log the state of said user.
 */
exports.System.isActive = function(user, state)
{
	var _this = this,
		node = (state) ? this._id : null;

	if (typeof(user) != 'string')
	{
		database.userModel.update({account: {'$in' : user}}, {node: node}, function(err) {});
	}
	else
	{
		database.userModel.update({account: user}, {node: node}, function(err) {});
				
		if (!state && server.client_data[user].sockets.length == 0)
			delete server.client_data[user];
		// we can get away with deleting it here, they are completely logged out, we'll
		// just repopulate it when they come back.
	}
};

/*
 * System::networkLog
 *
 * Log the string to the users individual network log record
 */
exports.System.networkLog = function(account, network, logString)
{
	function callback()
	{
		database.networkLogsModel.update({account: account, network: network}, {
			account: account,
			network: network,
			'$inc': {counter: 1},
			'$push': {logs: logString}
		}, {upsert: false}, function(err) {});

		database.networkLogsModel.update({account: account, network: network, counter: {'$gt': 25}}, {'$inc': {counter: -1}, '$pop': {logs: -1}}, function(err) {});
		// pop earlier logs off
	}
	
	database.networkLogsModel.findOne({account: account, network: network}, function(err, doc)
	{
		if (doc == null)
		{
			newLog = new database.networkLogsModel();
			newLog.account = account;
			newLog.network = network;
			newLog.counter = 1;
			newLog.logs = [];
			
			newLog.save(callback);
		}
		else
		{
			callback();
		}
	});
};