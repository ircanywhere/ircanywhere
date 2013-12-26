Tabs = (function() {
	"use strict";

	var Module = {
		networks: {
			rewind: function() {}
		},
		urls: {},
		
		getNetworks: function() {
			this.networks = Networks.find({}, {
				reactive: true,
				fields: {
					'_id': 1,
					'internal.tabs': 1,
					'internal.status': 1,
					'internal.url': 1,
					'name': 1
				}, transform: function(doc) {
					var tabs = [];
					for (var title in doc.internal.tabs) {
						var tab = doc.internal.tabs[title];
						
						if (tab.type == 'network') {
							var collection = Networks;
						} else if (tab.type == 'channel') {
							var collection = Channels;
						} else {
							var collection = Tabs;
						}
						// determine what type of collection it is

						tab.status = doc.internal.status;
						tab.url = (tab.type == 'network') ? doc.internal.url : doc.internal.url + '/' + encodeURIComponent(tab.target);
						tab.title = (tab.active) ? tab.title : '(' + tab.title + ')';
						tab.networkId = doc._id;
						tab.document = collection.findOne({_id: tab.key});
						// reset some values

						tabs.push(tab);
					};
					// re-construct tabs, because #each in Spark doesn't like objects

					doc.tabArray = tabs;
					doc.url = doc.internal.url;
					delete doc.internal;
					// reorganise and clean up the document

					return doc;
				}
			});
		}
	};

	return Module;
}());