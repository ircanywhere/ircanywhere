Application = (function() {
	"use strict";

	var jsonminify = Meteor.require('jsonminify'),
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
			},

	var Class = {
		init: function() {

			Meteor.config = JSON.parse(jsonminify(raw));
			check(Meteor.config, schema);
			// attempt to validate our config file
		}
	};

	return Manager;
}());
// create our application

Meteor.application = Object.create(Application);
Meteor.application.init();
// assign it to Meteor namespace so its accessible