Application = function(fs, raw) {
	"use strict";

	var hooks = Meteor.require('hooks'),
		winston = Meteor.require('winston'),
		os = Meteor.require('os'),
		path = Meteor.require('path'),
		jsonminify = Meteor.require('jsonminify');

	var schema = new SimpleSchema({
		'reverseDns': {
			type: String,
			optional: false
		},
		'enableRegistrations': {
			type: Boolean,
			optional: false
		},
		'ssl': {
			type: Boolean,
			optional: true
		},
		'forkProcess': {
			type: Boolean,
			optional: false
		},
		'email': {
			type: Object,
			optional: false
		},
		'email.forceValidation': {
			type: Boolean,
			optional: false
		},
		'email.siteName': {
			type: String,
			optional: true
		},
		'email.from': {
			type: String,
			optional: false
		},
		'clientSettings': {
			type: Object,
			optional: false
		},
		'clientSettings.networkLimit': {
			type: Number,
			min: 1,
			max: 10,
			optional: false
		},
		'clientSettings.networkRestriction': {
			type: String,
			optional: true
		},
		'clientSettings.userNamePrefix': {
			type: String,
			optional: false
		},
		'defaultNetwork': {
			type: Object,
			optional: false
		},
		'defaultNetwork.server': {
			type: String,
			optional: false
		},
		'defaultNetwork.port': {
			type: Number,
			min: 1,
			max: 65535,
			optional: false
		},
		'defaultNetwork.realname': {
			type: String,
			optional: false
		},
		'defaultNetwork.secure': {
			type: Boolean,
			optional: true
		},
		'defaultNetwork.password': {
			type: String,
			optional: true
		},
		'defaultNetwork.channels': {
			type: [Object],
			optional: true
		},
		'defaultNetwork.channels.$.channel': {
			type: String,
			optional: false,
			regEx: /([#&][^\x07\x2C\s]{0,200})/
		},
		'defaultNetwork.channels.$.password': {
			type: String,
			optional: true
		}
	});

	var App = {
		init: function() {
			this.config = JSON.parse(jsonminify(raw));
			check(this.config, schema);
			// attempt to validate our config file

			this.getPath();
			this.setupWinston();
			this.setupNode();
			// next thing to do if we're all alright is setup our node
			// this has been implemented now in the way for clustering

			this.smartjson = JSON.parse(fs.readFileSync(this.config.assetPath + '/../smart.json'));
		},

		getPath: function() {
			if (process.env.NODE_ENV == 'development') {
				var realPath = __meteor_bootstrap__.serverDir.split('.meteor/'),
					path = realPath[0] + 'private/';

				this.config.rootPath = realPath[0];
			} else {
				var realPath = __meteor_bootstrap__.serverDir,
					path = realPath + '/assets/app/';

				this.config.rootPath = realPath;
			}
			// get the full url, depending on the environment, development or private
			// This is a bit hacky, although meteor provides no better more reliable way.. atm

			this.config.assetPath = path;
		},

		setupWinston: function() {
			this.logger = new (winston.Logger)({
				transports: [
					new (winston.transports.File)({
						name: 'error',
						level: 'error',
						filename: this.config.rootPath + 'logs/error.log',
						json: false,
						timestamp: true
					}),
					new (winston.transports.File)({
						name: 'warn',
						level: 'warn',
						filename: this.config.rootPath + 'logs/warn.log',
						json: false,
						timestamp: true
					}),
					new (winston.transports.File)({
						name: 'info',
						level: 'info',
						filename: this.config.rootPath + 'logs/info.log',
						json: false,
						timestamp: true
					})
				]
			});
		},

		setupNode: function() {
			var data = '',
				json = {},
				defaultJson = {
					endpoint: Meteor.absoluteUrl('', this.config.ssl),
					hostname: os.hostname(),
					reverseDns: this.config.reverseDns,
					port: process.env.PORT,
					ipAddress: (process.env.IP_ADDR) ? process.env.IP_ADDR : '0.0.0.0'
				};

			try {
				data = fs.readFileSync(this.config.assetPath + 'node.json', {encoding: 'utf8'});
				json = JSON.parse(data);

				var node = Nodes.findOne({_id: json.nodeId});

				json = defaultJson;
				Nodes.update({_id: json.nodeId}, defaultJson);

				json.nodeId = node._id;
			} catch (e) {			
				var nodeId = Nodes.insert(defaultJson);

				json = defaultJson;
				json.nodeId = nodeId;
			}

			Meteor.nodeId = json.nodeId;
			
			if (data === JSON.stringify(json))
				return false;

			fs.writeFile(this.config.assetPath + 'node.json', JSON.stringify(json), function(err) {
				if (err)
					throw err;
				else
					console.log('Node settings saved in private/node.json. Server might restart, it\'s advised not to edit or delete this file unless instructed to do so by the developers');
			});
		}
	};

	App.init();
	// initiate the module if need be

	return _.extend(App, hooks);
};