Application = (function() {
	"use strict";

	var winston = Meteor.require('winston'),
		os = Meteor.require('os'),
		fs = Meteor.require('fs'),
		path = Meteor.require('path'),
		jsonminify = Meteor.require('jsonminify'),
		raw = Assets.getText('config.json');
	// dependencies
	
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
			Meteor.config = JSON.parse(jsonminify(raw));
			check(Meteor.config, schema);
			// attempt to validate our config file

			this.getPath();
			this.setupWinston();
			this.setupNode();
			// next thing to do if we're all alright is setup our node
			// this has been implemented now in the way for clustering
		},

		getPath: function() {
			if (process.env.NODE_ENV == 'development') {
				var realPath = __meteor_bootstrap__.serverDir.split('.meteor/'),
					path = realPath[0] + 'private/';

				Meteor.config.rootPath = realPath[0];
			} else {
				var realPath = __meteor_bootstrap__.serverDir,
					path = realPath + '/assets/app/';

				Meteor.config.rootPath = realPath;
			}
			// get the full url, depending on the environment, development or private
			// XXX - This is a bit hacky, although meteor provides no better more reliable way?

			Meteor.config.assetPath = path;
		},

		setupWinston: function() {
			Meteor.logger = new (winston.Logger)({
				transports: [
					new (winston.transports.File)({
						name: 'error',
						level: 'error',
						filename: Meteor.config.rootPath + 'logs/error.log',
						json: false,
						timestamp: true
					}),
					new (winston.transports.File)({
						name: 'warn',
						level: 'warn',
						filename: Meteor.config.rootPath + 'logs/warn.log',
						json: false,
						timestamp: true
					}),
					new (winston.transports.File)({
						name: 'info',
						level: 'info',
						filename: Meteor.config.rootPath + 'logs/info.log',
						json: false,
						timestamp: true
					})
				]
			});
		},

		setupNode: function() {
			// XXX - Stop this from happening on tests, it's trashing the speed completely

			var data = '',
				json = {},
				defaultJson = {
					endpoint: Meteor.absoluteUrl('', Meteor.config.ssl),
					hostname: os.hostname(),
					reverseDns: Meteor.config.reverseDns,
					port: process.env.PORT,
					ipAddress: (process.env.IP_ADDR) ? process.env.IP_ADDR : '0.0.0.0'
				};

			try {
				data = fs.readFileSync(Meteor.config.assetPath + 'node.json', {encoding: 'utf8'});
				json = JSON.parse(data);

				var node = Nodes.findOne(json.nodeId);

				json = defaultJson;
				Nodes.update(json.nodeId, defaultJson);

				json.nodeId = node._id;
			} catch (e) {			
				var nodeId = Nodes.insert(defaultJson);

				json = defaultJson;
				json.nodeId = nodeId;
			}

			Meteor.nodeId = json.nodeId;
			
			if (data === JSON.stringify(json))
				return false;

			fs.writeFile(Meteor.config.assetPath + 'node.json', JSON.stringify(json), function(err) {
				if (err)
					throw err;
				else
					console.log('Node settings saved in private/node.json. Server might restart, it\'s advised not to edit or delete this file unless instructed to do so by the developers');
			});
		}
	};

	return App;
}());

Meteor.application = Object.create(Application);
Meteor.application.init();