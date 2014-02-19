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
	validate(this.config, schema);
	// attempt to validate our config file

	this.database = {
		mongo: this.config.mongo.split(/\//i),
		oplog: this.config.oplog.split(/\//i)
	};

	this.mongo = mongo.MongoClient.sync.connect(this.config.mongo);
	this.oplog = mongo.MongoClient.sync.connect(this.config.oplog);
	// two db connections because we're greedy

	this.Nodes = this.mongo.collection('nodes');
	this.Users = this.mongo.collection('users');
	this.Networks = this.mongo.collection('networks');
	this.Tabs = this.mongo.collection('tabs');
	this.ChannelUsers = this.mongo.collection('channelUsers');
	this.Events = this.mongo.collection('events');
	this.Commands = this.mongo.collection('commands');
	this.Oplog = this.oplog.collection('oplog.rs');

	this.setupOplog();
	// setup our oplog tailer, this gives us Meteor-like observes

	this.setupWinston();
	this.setupNode();
	// next thing to do if we're all alright is setup our node
	// this has been implemented now in the way for clustering

	this.setupServer();
	// setup express server

	this.ee.emit('ready');
	// initiate sub-objects
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
	// XXX - This needs to be re-ran every time a connection is established because if it's ran
 	//		 and the database driver disconnects then we're fucked!
	
	var self = this,
		start = (new Date().getTime() / 1000);

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
				self.ee.emit([col, 'insert'], item.o);
				// emit an event
				break;
			case 'u':
				self.mongo.collection(col).findOne(item.o2, function(err, doc) {
					self.ee.emit([col, 'update'], doc);
				});
				// get the new full document
				break;
			case 'd':
				self.ee.emit([col, 'delete'], item.o._id);
				// emit
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
	if (!fs.existsSync('./logs')) {
		fs.mkdirSync('./logs');
	}

	this.logger = new (winston.Logger)({
		transports: [
			new (winston.transports.Console)(),
			new (winston.transports.File)({
				name: 'error',
				level: 'error',
				filename: './logs/error.log',
				handleExceptions: true,
				json: false,
				timestamp: false
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
		],
		exitOnError: true
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
	var data = '',
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

	var node = this.Nodes.sync.findOne(query);
	if (node !== null) {
		this.Nodes.update(query, defaultJson, {safe: false});
		json = _.extend(node, defaultJson);
		json._id = json._id.toString();
	} else {
		this.Nodes.sync.insert(defaultJson, {safe: false});
		json = defaultJson;
	}

	json._id = json._id.toString();
	this.nodeId = json._id;
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
	// XXX - Clean this shit up before 0.2 final it's horrible
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
		server = require('http').createServer(app),
		sockjsServer = sockjs.createServer({sockjs_url: 'http://cdn.sockjs.org/sockjs-0.3.min.js'});
	// setup a http server

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

	sockjsServer.on('connection', socketManager.onSocketOpen.bind(socketManager));
	// websocket routes

	sockjsServer.installHandlers(server, {prefix: '/websocket'});

	server.listen(this.config.port);

	this.app = app;
	this.sockjs = sockjsServer;
	// put them in the main namespace
}

exports.Application = _.extend(Application, hooks);