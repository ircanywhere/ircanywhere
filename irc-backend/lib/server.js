var arguments = process.argv.splice(2),
	defconf = require('../../' + arguments[0]);

exports.Server = {};
exports.Server.app = {};
exports.Server.config = defconf;

exports.Server.client_data = {};
exports.Server.clients = {};
exports.Server.accountTypes = {};
exports.Server.defaultAccType = '4f57b8ced49a753889df9dea';
// setup some variables

var domain = require('domain'),
	crypto = require('crypto'),
	express = require('express'),
	fs = require('fs'),
	io = {},
	database = require('./database').Database,
	system = require('./system').System,
	stats = require('./stats').Stats,
	api = require('./api').API,
	commandHandler = require('./command_handler').CommandHandler;
	exports.Server.d = domain.create();

/*
 * Server::run
 * 
 * boots up the daemon
 */
exports.Server.run = function()
{
	var _this = this;

	_this.d.on('error', function(err)
	{
		system.log.error(err);
	});

	_this.d.run(function()
	{
		fs.writeFile('irc-backend/irc-backend.pid', process.pid);

		database.connect(function()
		{
			system.runTasks();
			// run some functions to set everything up

			_this.app = express.createServer().listen(system.config.port);
			_this.app.use(express.bodyParser());
			// setup the ssl server on the correct port.

			io = require('socket.io').listen(_this.app);
			// setup the server as an ssl server and also use gzip

			//io.set('origins', 'http://localhost:5000');
			io.set('heartbeats', true);
			io.set('browser client', false);
			io.set('log level', 2);
			io.set('transports', [
				'websocket',
				//'flashsocket',
				'xhr-polling',
				'jsonp-polling',
				'htmlfile'
			]);
			// set socket.io settings

			io.set('logger', {
				debug: function() {},
				warn: system.loggers.socket.warn,
				info: system.loggers.socket.info,
			});
			// set socket.io settings

			api.createServer();
			_this.createServer();
			// boot socket.io server
		});
	});
};

/*
 * Server::createServer
 * 
 * This creates our websocket server
 */
exports.Server.createServer = function()
{
	var _this = this;
		_this.io = io;
	
	/*
	 * io.sockets.on
	 * Handle incoming websockets
	 */
	io.sockets.on('connection', function (socket)
	{
		socket.on('login', function (data) {
			stats.clientDataRecv += JSON.stringify(data).length;
			commandHandler.login(socket, data);
		});

		socket.on('changeTab', function (data) {
			stats.clientDataRecv += JSON.stringify(data).length;
			commandHandler.changeTab(socket, data);
		});

		socket.on('addNetwork', function (data) {
			stats.clientDataRecv += JSON.stringify(data).length;
			commandHandler.addNetwork(socket, data);
		});

		socket.on('removeNetwork', function (data) {
			stats.clientDataRecv += JSON.stringify(data).length;
			commandHandler.removeNetwork(socket, data);
		});

		socket.on('connectNetwork', function (data) {
			stats.clientDataRecv += JSON.stringify(data).length;
			commandHandler.connectNetwork(socket, data);
		});

		socket.on('disconnectNetwork', function (data) {
			stats.clientDataRecv += JSON.stringify(data).length;
			commandHandler.disconnectNetwork(socket, data);
		});

		socket.on('updateNetwork', function (data) {
			stats.clientDataRecv += JSON.stringify(data).length;
			commandHandler.updateNetwork(socket, data);
		});

		socket.on('getChanList', function (data) {
			stats.clientDataRecv += JSON.stringify(data).length;
			commandHandler.getChanList(socket, data);
		});

		socket.on('getBacklog', function (data) {
			stats.clientDataRecv += JSON.stringify(data).length;
			commandHandler.getBacklog(socket, data);
		});

		socket.on('getUnreadNum', function (data) {
			stats.clientDataRecv += JSON.stringify(data).length;
			commandHandler.getUnreadNum(socket, data);
		});

		socket.on('markRead', function (data) {
			stats.clientDataRecv += JSON.stringify(data).length;
			commandHandler.markRead(socket, data);
		});		

		socket.on('data', function (data) {
			stats.clientDataRecv += JSON.stringify(data).length;
			commandHandler.send(socket, data);
		});

		socket.on('disconnect', function () {
			commandHandler.disconnect(socket);
		});
	});
};

/*
 * Server::returnUI
 *
 * Return a ui info without the .socket part
 */
exports.Server.returnUI = function(ui)
{
	var new_data = {};
	for (var k in ui)
	{
		if (k != 'sockets' && k != 'networks' && k != 'send' && k != 'timer' && k != 'disconnect_timer') 
			new_data[k] = ui[k];
	}
	
	return new_data;
};

/*
 * Server::emit
 * 
 * Emit our data (socket.io)
 */
exports.Server.emit = function(target, socketEvent, data, isSocket)
{
	var _this = this,
		isSocket = isSocket || false,
		length = socketEvent.length + JSON.stringify(data).length;

	if (target == undefined || (!isSocket && target.sockets.length == null) || (isSocket && target == null))
		return;
	// bail if user is undefined

	if (isSocket)
	{
		stats.clientDataSent += length;
		target.emit(socketEvent, data);
		// send the data to the socket
	}
	else
	{
		for (var si in target.sockets)
		{
			var socket = target.sockets[si];
			if (socket == null)
				return false;
			
			stats.clientDataSent += length;
			socket.emit(socketEvent, data);
		}
		// send to all sockets
	}	
};

/*
 * Server::generateTabId
 * 
 * Generate a tab id from the network and target
 */
exports.Server.generateTabId = function(network, type, target)
{
	var id = (target == undefined) ? network + '-' + type : network + '-' + type + '-' + target,
		tabId = new Buffer(id).toString('base64');

	return tabId;
};

/*
 * Server::createHTTPChunk
 *
 * A function to create a temporary http chunk url
 */
exports.Server.createHTTPChunk = function(socket, hash, type, data)
{
	var _this = this,
		ts = +new Date(),
		random = Math.floor((Math.random() * 1000) + 1),
		rhash = crypto.createHash('md5').update(ts + hash + random).digest('hex'),
		isSocket = (type == 'chanlist') ? false : true;
	
	_this.app.get('/' + type + '/' + rhash, function(req, res) {
		res.header('Access-Control-Allow-Origin', 'http://localhost:5000');
		res.json(data);
	});
	// create a temp path for the backlog

	_this.emit(socket, type, {url: '/' + type + '/' + rhash}, isSocket);
	// emit the backlog url

	setTimeout(function() {
		_this.app.remove('/' + type + '/' + rhash);
	}, 3000);
	// delete the path
};

exports.Server.run();
