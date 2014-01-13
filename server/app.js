Application = function() {
	"use strict";

	var _ = require('lodash'),
		hooks = require('hooks'),
		winston = require('winston'),
		os = require('os'),
		fs = require('fs'),
		raw = fs.readFileSync('./private/config.json').toString(),
		path = require('path'),
		jsonminify = require('jsonminify'),
		validate = require('simple-schema'),
		express = require('express.io'),
		mongo = require('mongo-sync'),
		Fiber = require('fibers');

	var schema = {
			'mongo': {
				type: 'string',
				required: true
			},
			'port': {
				type: 'number',
				required: true
			},
			'reverseDns': {
				type: 'string',
				required: true
			},
			'enableRegistrations': {
				type: 'boolean',
				required: true
			},
			'ssl': {
				type: 'boolean',
				required: false
			},
			'forkProcess': {
				type: 'boolean',
				required: true
			},
			'email': {
				type: 'object',
				required: true
			},
			'email.siteName': {
				type: 'string',
				required: false
			},
			'email.from': {
				type: 'string',
				required: true
			},
			'email.smtp': {
				type: 'string',
				required: true
			},
			'clientSettings': {
				type: 'object',
				required: true
			},
			'clientSettings.networkLimit': {
				type: 'number',
				min: 1,
				max: 10,
				required: true
			},
			'clientSettings.networkRestriction': {
				type: 'string',
				required: false
			},
			'clientSettings.userNamePrefix': {
				type: 'string',
				required: true
			},
			'defaultNetwork': {
				type: 'object',
				required: true
			},
			'defaultNetwork.server': {
				type: 'string',
				required: true
			},
			'defaultNetwork.port': {
				type: 'number',
				min: 1,
				max: 65535,
				required: true
			},
			'defaultNetwork.realname': {
				type: 'string',
				required: true
			},
			'defaultNetwork.secure': {
				type: 'boolean',
				required: false
			},
			'defaultNetwork.password': {
				type: 'string',
				required: false
			},
			'defaultNetwork.channels': {
				type: 'array',
				required: false
			},
			'defaultNetwork.channels.$.channel': {
				type: 'string',
				required: true,
				regEx: /([#&][^\x07\x2C\s]{0,200})/
			},
			'defaultNetwork.channels.$.password': {
				type: 'string',
				required: false
			}
		},
		jsSources = [
			'./client/lib/helpers.js',
			'./client/lib/parser.js',
			'./client/lib/resizer.js',
			'./client/lib/router.js',
			'./client/lib/index.js'
		];

	var App = {
		init: function() {
			App.config = JSON.parse(jsonminify(raw));
			validate(App.config, schema);
			// attempt to validate our config file

			App.mongo = new mongo.Server('127.0.0.1').db('ircanywhere');

			App.Nodes = App.mongo.getCollection('nodes');
			App.Users = App.mongo.getCollection('users');
			App.Networks = App.mongo.getCollection('networks');
			App.Tabs = App.mongo.getCollection('tabs');
			App.ChannelUsers = App.mongo.getCollection('channelUsers');
			App.Events = App.mongo.getCollection('events');
			App.Commands = App.mongo.getCollection('commands');

			App.setupWinston();
			App.setupNode();
			// next thing to do if we're all alright is setup our node
			// this has been implemented now in the way for clustering

			App.setupServer();
		},

		setupWinston: function() {
			App.logger = new (winston.Logger)({
				transports: [
					new (winston.transports.Console)(),
					new (winston.transports.File)({
						name: 'error',
						level: 'error',
						filename: './logs/error.log',
						json: false,
						timestamp: true
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
		},

		setupNode: function() {
			var data = '',
				json = {},
				query = {_id: null},
				defaultJson = {
					endpoint: (App.config.ssl) ? 'https://0.0.0.0:' + App.config.port : 'http://0.0.0.0:' + App.config.port,
					hostname: os.hostname(),
					reverseDns: App.config.reverseDns,
					port: App.config.port,
					ipAddress: '0.0.0.0'
				};

			try {
				data = fs.readFileSync('./private/node.json', {encoding: 'utf8'});
				json = JSON.parse(data);
				query = {_id: new mongo.ObjectId(json._id)};
			} catch (e) {
				json = defaultJson;
			}

			var node = App.Nodes.find(query).toArray();
			if (node.length > 0) {
				App.Nodes.update(query, defaultJson, {safe: false});
				json = _.extend(node[0], defaultJson);
				json._id = json._id.toString();
			} else {
				var node = App.Nodes.insert(defaultJson, {safe: false});
				json = defaultJson;
			}

			json._id = json._id.toString();
			App.nodeId = json._id;
			data = (data == '') ? {} : JSON.parse(data);
			// house keeping

			if (_.isEqual(data, json)) {
				return false;
			}

			fs.writeFile('./private/node.json', JSON.stringify(json), function(err) {
				if (err) {
					throw err;
				} else {
					App.logger.info('Node settings saved in private/node.json. Server might restart, it\'s advised not to edit or delete this file unless instructed to do so by the developers');
				}
			});
		},

		build: function() {
			App.sources = {
				javascript: ''
			};

			jsSources.forEach(function(file) {
				App.sources.javascript += fs.readFileSync(file);
			});
			// loop our source files
		},

		setupServer: function() {
			App.build();
			
			App.app = express().http().io();
			// setup a http server

			App.app.io.configure(function() {
				App.app.io.enable('browser client minification');
				App.app.io.enable('browser client etag');
        		App.app.io.enable('browser client gzip');
			});
			// socket.io settings

			App.app.use(express.static('client'));
			App.app.use(express.bodyParser())
			// setup middleware

			App.app.get('/ircanywhere.min.js', function(req, res) {
				res.header('Content-Type', 'application/javascript');
				res.end(App.sources.javascript);
			});

			App.app.post('/register', function(req, res) {
				Fiber(function() {
					var response = userManager.registerUser(req.param('name', ''), req.param('nickname', ''), req.param('email', ''), req.param('password', ''), req.param('confirm-password', ''));

					res.header('Content-Type', 'application/json');
					res.end(JSON.stringify(response));
				}).run();
			});

			App.app.post('/login', function(req, res) {
				Fiber(function() {
					var response = userManager.userLogin(req.param('email', ''), req.param('pass', ''));

					res.header('Content-Type', 'application/json');
					res.end(JSON.stringify(response));
				}).run();
			});
			// setup routes

			App.app.listen(this.config.port);
		}
	};

	Fiber(App.init).run();
	// initiate the module if need be

	return _.extend(App, hooks);
};

exports.Application = Application;