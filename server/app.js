Application = function() {
	"use strict";

	var _ = require('lodash'),
		hooks = require('hooks'),
		winston = require('winston'),
		events = require('eventemitter2'),
		os = require('os'),
		fs = require('fs'),
		raw = fs.readFileSync('./private/config.json').toString(),
		path = require('path'),
		jsonminify = require('jsonminify'),
		validate = require('simple-schema'),
		express = require('express.io'),
		mongo = require('mongodb');

	var schema = {
		'mongo': {
			type: 'string',
			required: true
		},
		'oplog': {
			type: 'string',
			required: true
		},
		'url': {
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
	};

	var App = {
		ee: new events.EventEmitter2({
			wildcard: true,
			delimiter: '.',
			maxListeners: 0
		}),
		// setup an event emitter

		docs: {},

		init: function() {
			App.config = JSON.parse(jsonminify(raw));
			validate(App.config, schema);
			// attempt to validate our config file

			App.database = {
				mongo: App.config.mongo.split(/\//i),
				oplog: App.config.oplog.split(/\//i)
			};

			App.mongo = mongo.MongoClient.sync.connect(App.config.mongo);
			App.oplog = mongo.MongoClient.sync.connect(App.config.oplog);
			// two db connections because we're greedy

			App.Nodes = App.mongo.collection('nodes');
			App.Users = App.mongo.collection('users');
			App.Networks = App.mongo.collection('networks');
			App.Tabs = App.mongo.collection('tabs');
			App.ChannelUsers = App.mongo.collection('channelUsers');
			App.Events = App.mongo.collection('events');
			App.Commands = App.mongo.collection('commands');
			App.Oplog = App.oplog.collection('oplog.rs');

			App.setupOplog();
			// setup our oplog tailer, this gives us Meteor-like observes

			App.setupWinston();
			App.setupNode();
			// next thing to do if we're all alright is setup our node
			// this has been implemented now in the way for clustering

			App.setupServer();
			// setup express.io server

			App.ee.emit('ready');
			// initiate sub-objects
		},

		setupOplog: function() {
			var start = Math.floor(+new Date() / 1000),
				collections = App.mongo.sync.collectionNames();

			collections.forEach(function(col) {
				var name = col.name.split('.')[1],
					data = App.mongo.collection(name).sync.find({}).sync.toArray();
				
				App.docs[name] = {};
				data.forEach(function(doc) {
					App.docs[name][doc._id.toString()] = doc;
				});
			});
			// storing all the documents in App.docs so we can have a handle
			// on what documents are getting deleted etc
			// this also lets us calculate document changes so we can propogate just
			// the differences down to the clients to save bandwidth
			// at the cost of higher memory usage for the server though

			App.Oplog.find({}, {'tailable': true}).each(function(err, item) {
				if (err) {
					throw err;
				}

				if (!(item.ts.high_ >= start)) {
					return false;
				}
				
				var collection = item.ns.split('.'),
					col = collection[1];
				// get the collection name

				if (collection[0] !== App.database.mongo[3]) {
					return false;
				}
				// bail if this is a different database

				switch(item.op) {
					case 'i':
						var id = item.o._id.toString();
						if (!App.docs[col][id]) {
							App.docs[col][id] = item.o;
						}
						// alter our global document collection

						App.ee.emit([col, 'insert'], item.o);
						// emit an event
						break;
					case 'u':
						App.mongo.collection(col).findOne(item.o2, function(err, doc) {
							var id = doc._id.toString();
							if (!App.docs[col][id]) {
								App.docs[col][id] = doc;
							}
							// alter our global document collection

							App.ee.emit([col, 'update'], doc);
						});
						// get the new full document
						break;
					case 'd':
						var id = item.o._id.toString();
						if (App.docs[col][id]) {
							setTimeout(function() {
								delete App.docs[col][id];
							}, 10000);
						}
						// delete it, in 10 seconds so if we need to use it anywhere we can

						App.ee.emit([col, 'delete'], App.docs[col][id], item.o._id);
						// emit
						break;
					case 'c':
						for (var cmd in item.o) {
							App.ee.emit([item.o[cmd], cmd]);
						}
					default:
						break;
				}
				// emit the event
			});
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

			var node = App.Nodes.sync.findOne(query);
			if (node !== null) {
				App.Nodes.update(query, defaultJson, {safe: false});
				json = _.extend(node, defaultJson);
				json._id = json._id.toString();
			} else {
				App.Nodes.sync.insert(defaultJson, {safe: false});
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
				}
			});
		},

		setupServer: function() {
			App.app = express().http().io();
			// setup a http server

			App.app.enable('trust proxy');
			// express settings

			App.app.use(express.compress());
			//App.app.use(express.static('client', {maxAge: 86400000}));
			App.app.use(express.static('client'));
			App.app.use(express.cookieParser(App.nodeId));
			App.app.use(express.json());
			App.app.use(express.urlencoded());
			App.app.use(fibrous.middleware);
			// setup middleware

			App.app.get('/*', function(req, res) {
				res.sendfile('./client/templates/html/index.html');
			});
			// setup routes

			App.app.listen(App.config.port);
		}
	};

	fibrous.run(App.init);
	// initiate the module if need be

	return _.extend(App, hooks);
};

exports.Application = Application;