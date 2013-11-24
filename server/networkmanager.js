Networks = new Meteor.SmartCollection('networks');

NetworkManager = (function() {
	"use strict";

	var Manager = {

		init: function() {

			
		},

		addNetwork: function(user, network) {
			network.autoRejoin = (network.autoRejoin === undefined) ? false : network.autoRejoin;
			network.autoConnect = (network.autoConnect === undefined) ? true : network.autoConnect;
			network.retryCount = (network.retryCount === undefined) ? 10 : network.retryCount;
			network.retryDelay = (network.retryDelay === undefined) ? 1000 : network.retryDelay;
			network.secure = (network.secure === undefined) ? false : network.secure;
			network.password = (network.password === undefined) ? '' : network.password;
			network.channels = (network.channels === undefined) ? [] : network.channels;
			// because some settings can be omitted, we're going to set them to
			// the hard-coded defaults if they are, ok. We don't need to worry about
			// validating them before hand either because app.js takes care of that.
			// 
			// XXX - this looks a bit messy, tidied up at some point? it would be nice
			//		 if validate could automatically cast these, maybe it can with cast: {}

			
		}
	};

	return Manager;
}());
// create our factory object

Meteor.networkManager = Object.create(NetworkManager);
Meteor.networkManager.init();
// assign it to Meteor namespace so its accessible and rememberable