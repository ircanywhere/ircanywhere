/**
 * IRCAnywhere server/app.js
 *
 * @title Application
 * @copyright (c) 2013-2014 http://ircanywhere.com
 * @license GPL v2
 * @author Ricki Hastings
*/

var _ = require('lodash'),
	hooks = require('hooks'),
	winston = require('winston'),
	events = require('eventemitter2'),
	os = require('os'),
	fs = require('fs'),
	util = require('util'),
	raw = fs.readFileSync('./config.json').toString(),
	schema = require('./schema').schema,
	path = require('path'),
	jsonminify = require('jsonminify'),
	validate = require('simple-schema'),
	express = require('express'),
	sockjs = require('sockjs'),
	mongo = require('mongodb');

/**
 * The applications's main object, contains all the startup functions.
 * All of the objects contained in this prototype are extendable by standard
 * rules.
 *
 * Examples: ::
 *
 * 	application.post('init', function(next) {
 * 		console.log('do something after init() is run');
 * 		next();
 * 	});
 *
 * @class Application
 * @method Application
 * @return void
 */
function Application() {
	this.ee = new events.EventEmitter2({
		wildcard: true,
		delimiter: '.',
		maxListeners: 0
	});
	// setup our event emitter

	fibrous.run(this.init.bind(this));
	// initiate the module

	process.title = 'ircanywhere';
	// set process title
}

/**
 * @member {Boolean} verbose A flag to determine whether verbose logging is enabled or not
 */
Application.prototype.verbose = (process.env.VERBOSE && process.env.VERBOSE == 'true') ? true : false;

/**
 * @member {Object} config A copy of the parsed config object
 */
Application.prototype.config = JSON.parse(jsonminify(raw));

/**
 * @member {Object} packagejson A copy of the project's package.json object
 */
Application.prototype.packagejson = JSON.parse(fs.readFileSync('./package.json').toString());

/**
 * This is the main entry point for the application, it should NOT be called under any circumstances.
 * However it can safely be extended by hooking onto the front or back of it using pre and post hooks.
 * Treat this method like the main() function in a C application.
 *
 * @method init
 * @return void
 */
Application.prototype.init = function() {
	var self = this;

	this.setupWinston();
	// setup winston first

	var validation = validate(this.config, schema);
	if (validation.length > 0) {
		console.log(new Date().toJSON(), '-', util.inspect(validation, {colors: true}));
		throw new Error('Invalid config settings, please amend.');
	}
	// attempt to validate our config file

	if (!this.config.clientSettings.networkRestriction) {
		this.config.clientSettings.networkRestriction = ['*'];
	}
	// amend any settings

	this.database = {
		mongo: this.config.mongo.split(/\//i),
		oplog: this.config.oplog.split(/\//i),
		settings: {
			db: {
				native_parser: true
			},
			server: {
				auto_reconnect: true
			}
			// XXX - Add repl set options and tie to config file
		}
	};

	mongo.MongoClient.connect(this.config.mongo, this.database.settings, function(err, db) {
		if (err) {
			throw err;
		}

		self.mongo = db;
		self.Nodes = db.collection('nodes');
		self.Users = db.collection('users');
		self.Networks = db.collection('networks');
		self.Tabs = db.collection('tabs');
		self.ChannelUsers = db.collection('channelUsers');
		self.Events = db.collection('events');
		self.Commands = db.collection('commands');

		mongo.MongoClient.connect(self.config.oplog, self.database.settings, function(oerr, odb) {
			if (oerr) {
				throw oerr;
			}

			self.oplog = odb;
			self.Oplog = odb.collection('oplog.rs');

			self.setupOplog();
			// setup the oplog tailer when we connect
		});

		self.setupNode();
		// next thing to do if we're all alright is setup our node
		// this has been implemented now in the way for clustering

		self.setupServer();
		// setup express server

		self.ee.emit('ready');
		// initiate sub-objects
	});
}

/**
 * This method initiates the oplog tailing query which will look for any incoming changes on the database.
 * Incoming changes are then handled and sent to the global event emitter where other classes and modules
 * can listen to for inserts, updates and deletes to a collection to do what they wish with the changes.
 *
 * @method setupOplog
 * @return void
 */
Application.prototype.setupOplog = function() {
	var self = this,
		start = (new Date().getTime() / 1000);

	this.channelUserDocs = {};
	this.ChannelUsers.find({}).each(function(err, item) {
		if (err || !item) {
			throw err;
		}

		self.channelUserDocs[item._id] = item;
	});

	this.Oplog.find({ts: {$gte: new mongo.Timestamp(start, start)}}, {tailable: true, timeout: false}).each(function(err, item) {
		if (err) {
			throw err;
		}
		
		var collection = item.ns.split('.'),
			col = collection[1];
		// get the collection name

		if (collection[0] !== self.database.mongo[3]) {
			return false;
		}
		// bail if this is a different database

		switch(item.op) {
			case 'i':
				if (col === 'channelUsers') {
					self.channelUserDocs[item.o._id] = item.o;
				}

				self.ee.emit([col, 'insert'], item.o);
				// emit an event
				break;
			case 'u':
				self.mongo.collection(col).findOne(item.o2, function(err, doc) {
					if (err || !doc) {
						return false;
					}
					
					if (col === 'channelUsers') {
						self.channelUserDocs[doc._id] = doc;
					}

					self.ee.emit([col, 'update'], doc);
				});
				// get the new full document
				break;
			case 'd':
				self.ee.emit([col, 'delete'], item.o._id, self.channelUserDocs[item.o._id]);
				// emit

				setTimeout(function() {
					if (self.channelUserDocs[item.o._id]) {
						delete self.channelUserDocs[item.o._id];
					}
				}, 5000);
				break;
			case 'c':
				for (var cmd in item.o) {
					self.ee.emit([item.o[cmd], cmd]);
				}
			default:
				break;
		}
		// emit the event
	});
}

/**
 * This function sets up our winston logging levels and transports. You can safely extend
 * or override this function and re-run it to re-initiate the winston loggers if you want to
 * change the transport to send to loggly or something via a plugin.
 *
 * @method setupWinston
 * @return void
 */
Application.prototype.setupWinston = function() {
	var self = this;

	if (!fs.existsSync('./logs')) {
		fs.mkdirSync('./logs');
	}

	this.logger = new (winston.Logger)({
		transports: [
			new (winston.transports.Console)({
				colorize: true,
				prettyPrint: true,
				timestamp: true
			}),
			new (winston.transports.File)({
				name: 'error',
				level: 'error',
				filename: './logs/error.log',
				prettyPrint: false,
				timestamp: true,
				json: false
			}),
			new (winston.transports.File)({
				name: 'warn',
				level: 'warn',
				filename: './logs/warn.log',
				json: false,
				timestamp: true
			}),
			new (winston.transports.File)({
				name: 'info',
				level: 'info',
				filename: './logs/info.log',
				json: false,
				timestamp: true
			})
		]
	});

	process.on('uncaughtException', function(err) {
		self.logger.log('error', err.stack, function() {
			process.exit(0);
		});
	});
}

/**
 * Checks for a node record to store in the file system and database
 * This is done to generate a 'unique' but always the same ID to identify
 * the system so we can make way for clustering in the future.
 * 
 * @method setupNode
 * @return void
 */
Application.prototype.setupNode = function() {
	var self = this,
		data = '',
		json = {},
		query = {_id: null},
		defaultJson = {
			endpoint: (this.config.ssl) ? 'https://0.0.0.0:' + this.config.port : 'http://0.0.0.0:' + this.config.port,
			hostname: os.hostname(),
			port: this.config.port,
			ipAddress: '0.0.0.0'
		};

	try {
		data = fs.readFileSync('./private/node.json', {encoding: 'utf8'});
		json = JSON.parse(data);
		query = {_id: new mongo.ObjectID(json._id)};
	} catch (e) {
		json = defaultJson;
	}

	this.Nodes.findOne(query, function(err, doc) {
		fibrous.run(function() {
			if (err) {
				throw err;
			}

			if (!doc) {
				json = self.Nodes.sync.insert(defaultJson)[0];
			} else {
				self.Nodes.sync.update(query, defaultJson);
				json = _.extend(doc, defaultJson);
			}

			json._id = json._id.toString();
			self.nodeId = json._id;
			data = (data == '') ? {} : JSON.parse(data);
			// house keeping

			if (_.isEqual(data, json)) {
				return false;
			}

			fs.writeFile('./private/node.json', JSON.stringify(json), function(err) {
				if (err) {
					throw err;
				}
			});
		});
	});
}

/**
 * This function is responsible for setting up the express webserver we use to serve the static files and
 * the sock.js server which hooks onto it to handle the websockets. None of the routes or rpc callbacks
 * are handled here.
 *
 * @method setupServer
 * @return void
 */
Application.prototype.setupServer = function() {
	var self = this,
		app = express(),
		sockjsServer = sockjs.createServer({sockjs_url: 'http://cdn.sockjs.org/sockjs-0.3.min.js'});

	if (application.config.ssl) {
		var https = require('https'),
			options = {
				key: fs.readFileSync('./private/certs/key.pem'),
				cert: fs.readFileSync('./private/certs/cert.pem'),
			},
			server = https.createServer(options, app);
	} else {
		var http = require('http'),
			server = http.createServer(app);
	}
	// setup a http(s) server

	app.enable('trust proxy');
	// express settings

	var winstonStream = {
		write: function(message, encoding) {
			//self.logger.log('info', message.slice(0, -1));
		}
	};
	// enable web server logging; pipe those log messages through winston

	app.use(express.logger({stream: winstonStream}));
	app.use(express.compress());
	app.use(express.static('client', {maxAge: 86400000}));
	app.use(express.cookieParser(this.nodeId));
	app.use(express.json());
	app.use(express.urlencoded());
	app.use(fibrous.middleware);
	// setup middleware

	app.get(/^\/(?!api\/(.*)).*$/, function(req, res) {
		res.sendfile('./client/templates/html/index.html');
	});
	// setup routes

	sockjsServer.on('connection', rpcHandler.onSocketOpen.bind(rpcHandler));
	// websocket routes

	sockjsServer.installHandlers(server, {prefix: '/websocket'});

	server.listen(this.config.port);

	this.app = app;
	this.sockjs = sockjsServer;
	// put them in the main namespace
}

exports.Application = _.extend(Application, hooks);