Application = (function() {
	"use strict";

	var os = Meteor.require('os'),
		fs = Meteor.require('fs'),
		path = Meteor.require('path'),
		jsonminify = Meteor.require('jsonminify'),
		raw = Assets.getText('config.json'),
		schema = new SimpleSchema({
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
			'defaultNetwork.realName': {
				type: String,
				optional: false
			},
			'defaultNetwork.autoRejoin': {
				type: Boolean,
				optional: true
			},
			'defaultNetwork.autoConnect': {
				type: Boolean,
				optional: true
			},
			'defaultNetwork.retryCount': {
				type: Number,
				min: 1,
				max: 20,
				optional: true
			},
			'defaultNetwork.retryDelay': {
				type: Number,
				min: 1000,
				max: 60000,
				optional: true
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
				type: [String],
				optional: true
			}
		});

	var App = {
		init: function() {
			Meteor.config = JSON.parse(jsonminify(raw));
			check(Meteor.config, schema);
			// attempt to validate our config file

			this.setupNode();
			// next thing to do if we're all alright is setup our node
			// this has been implemented now in the way for clustering
		},

		setupNode: function() {
			var data = '',
				json = {},
				defaultJson = {
					endpoint: Meteor.absoluteUrl('', Meteor.config.ssl),
					hostname: os.hostname(),
					reverseDns: Meteor.config.reverseDns,
					port: process.env.PORT,
					ipAddress: (process.env.IP_ADDR) ? process.env.IP_ADDR : '0.0.0.0'
				};

			if (process.env.NODE_ENV == 'development') {
				var realPath = __meteor_bootstrap__.serverDir.split('.meteor/'),
					path = realPath[0] + 'private/';
			} else {
				var realPath = __meteor_bootstrap__.serverDir,
					path = realPath + '/assets/app/';
			}
			// get the full url, depending on the environment, development or private
			// XXX - This is a bit hacky, although meteor provides no better more reliable way?

			try {
				data = fs.readFileSync(path + 'node.json', {encoding: 'utf8'});
				json = JSON.parse(data);
				// get the file contents

				var node = Nodes.findOne(json.nodeId);
				// get the node

				json = defaultJson;
				Nodes.update(json.nodeId, defaultJson);
				// we'll now reupdate it in the database

				json.nodeId = node._id;
			} catch (e) {			
				var nodeId = Nodes.insert(defaultJson);
				// insert the record and get a node id

				json = defaultJson;
				json.nodeId = nodeId;
				// update the json
			}
			
			if (data === JSON.stringify(json))
				return false;

			fs.writeFile(path + 'node.json', JSON.stringify(json), function(err) {
				if (err)
					throw err;
				else
					console.log('Node settings saved in private/node.json. Server might restart, it\'s advised not to edit or delete this file unless instructed to do so by the developers');
			});
		},

		reconnectClients: function() {

		}
	};

	return App;
}());
// create our application

Meteor.application = Object.create(Application);
Meteor.application.init();
// assign it to Meteor namespace so its accessible