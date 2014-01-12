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
		mongo = require('mongo-sync');

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
		'email.forceValidation': {
			type: 'boolean',
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
		init: function() {
			this.config = JSON.parse(jsonminify(raw));
			validate(this.config, schema);
			// attempt to validate our config file

			this.mongo = new mongo.Server('127.0.0.1').db('ircanywhere');

			App.Nodes = this.mongo.getCollection('nodes');
			App.Networks = this.mongo.getCollection('networks');
			App.Tabs = this.mongo.getCollection('tabs');
			App.ChannelUsers = this.mongo.getCollection('channelUsers');
			App.Events = this.mongo.getCollection('events');
			App.Commands = this.mongo.getCollection('commands');

			App.setupWinston();
			App.setupNode();
			// next thing to do if we're all alright is setup our node
			// this has been implemented now in the way for clustering

			App.setupServer();
		},

		setupWinston: function() {
			this.logger = new (winston.Logger)({
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
					endpoint: (this.config.ssl) ? 'https://0.0.0.0:' + this.config.port : 'http://0.0.0.0:' + this.config.port,
					hostname: os.hostname(),
					reverseDns: this.config.reverseDns,
					port: this.config.port,
					ipAddress: '0.0.0.0'
				};

			try {
				data = fs.readFileSync('./private/node.json', {encoding: 'utf8'});
				json = JSON.parse(data);
				query = {_id: new mongo.ObjectId(json._id)};
			} catch (e) {
				json = defaultJson;
			}

			var node = this.Nodes.find(query).toArray();
			if (node.length > 0) {
				this.Nodes.update(query, defaultJson, {safe: false});
				json = _.extend(node[0], defaultJson);
				json._id = json._id.toString();
			} else {
				var node = App.Nodes.insert(defaultJson, {safe: false});
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
				} else {
					App.logger.info('Node settings saved in private/node.json. Server might restart, it\'s advised not to edit or delete this file unless instructed to do so by the developers');
				}
			});
		},

		setupServer: function() {
			this.express = express();

			this.express.use(express.static('./client'));
			// setup routes

			this.express.listen(this.config.port);
			// listen
		}
	};

	App.init();
	// initiate the module if need be

	return _.extend(App, hooks);
};

exports.Application = Application;