Networks = new Meteor.SmartCollection('networks');

NetworkManager = (function() {
	"use strict";

	var Manager = {

		init: function() {

			
		},

		addNetwork: function(user, network) {

			
		}
	};

	return Manager;
}());
// create our factory object

Meteor.networkManager = Object.create(NetworkManager);
Meteor.networkManager.init();
// assign it to Meteor namespace so its accessible and rememberable