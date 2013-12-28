function App() {
	Deps.autorun(this.subscribe.bind(this));
	// setup a dependency for the subscriptions
};

// -------------------------------------
// All the core workings of the application is here, each part is split up into
// folders, see signup/signup.html(.less/.js) for the corresponding css/js. Much easier
// managing it this way, plus Meteor doesn't promote a proper MVC architecture like Backbone does
// it's all based upon templates, although we can extend the template objects for more functionality

App.prototype.subscribe = function() {
	var self = this;

	if (Meteor.user()) {
		Meteor.subscribe('networks', Meteor.user()._id);
		Meteor.subscribe('tabs', Meteor.user()._id);
		Meteor.subscribe('channels', Meteor.user()._id);
		Meteor.subscribe('commands', Meteor.user()._id);
		Meteor.subscribe('channelUsers', Meteor.user()._id);
		Meteor.subscribe('events', Meteor.user()._id);
	}
	// this function handles the subscriptions
};

App.prototype.getNetworks = function() {
	return Networks.find({}, {
		fields: {
			'_id': 1,
			'internal.tabs': 1,
			'internal.status': 1,
			'internal.url': 1,
			'nick': 1,
			'name': 1
		}, transform: function(doc) {
			var tabs = [];
			for (var title in doc.internal.tabs) {
				var tab = doc.internal.tabs[title];
				
				tab.nick = doc.nick;
				tab.status = doc.internal.status;
				tab.url = (tab.type == 'network') ? doc.internal.url : doc.internal.url + '/' + encodeURIComponent(tab.target);
				tab.title = (tab.active) ? tab.title : '(' + tab.title + ')';
				tab.networkId = doc._id;
				tab._id = tab.key;
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
};
// -------------------------------------

Application = new App();