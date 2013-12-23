Application = (function() {
	"use strict";

	var Module = {
		networks: [],
		// a reactive object holding our tabs

		updateTabs: function() {
			var self = this,
				networks = Networks.find({}, {fields: {
					'_id': 1,
					'internal.tabs': 1,
					'internal.url': 1,
					'internal.status': 1,
					'name': 1
				}});

			networks.forEach(function(doc) {
				var tabs = [];
				for (var title in doc.internal.tabs) {
					var tab = doc.internal.tabs[title];
					if (tab.type !== 'network') {
						tab.url = doc.internal.url;
						tabs.push(tab);
					}
				}

				self.networks.push({
					_id: doc._id,
					tabs: tabs,
					url: doc.internal.url,
					status: doc.internal.status,
					name: doc.name
				});
			});
		}
	};

	return Module;
}());