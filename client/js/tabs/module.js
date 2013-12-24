TabEngine = (function() {
	"use strict";

	var Module = {
		getTabList: function() {
			var tabs = this.getTabs().fetch(),
				returned = [];

			for (var network in tabs) {
				var tab = tabs[network];
				for (var title in tab.tabs) {
					returned.push(tab.tabs[title]);
				}
			}

			return returned;
		},

		getTabCollections: function(tabs) {
			tabs.forEach(function(tab) {

			});
			// loop through the tabs
		},

		renderTabs: function() {
			
		}
	};

	return Module;
}());