function App() {
	Deps.autorun(this.subscribe.bind(this));
	// setup a dependency for the subscriptions

	Handlebars.registerHelper('ifCond', function(v1, v2, options) {
		if(v1 === v2) {
			return options.fn(this);
		}
		return options.inverse(this);
	});
};

// -------------------------------------
// All the core workings of the application is here, each part is split up into
// folders, see signup/signup.html(.less/.js) for the corresponding css/js. Much easier
// managing it this way, plus Meteor doesn't promote a proper MVC architecture like Backbone does
// it's all based upon templates, although we can extend the template objects for more functionality

App.prototype.subscribe = function() {
	var self = this;

	if (Meteor.user()) {
		Meteor.subscribe('networks');
		Meteor.subscribe('tabs');
		Meteor.subscribe('channels');
		Meteor.subscribe('commands');
		Meteor.subscribe('channelUsers');
		Meteor.subscribe('events');
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

				if (tab.type == 'network') {
					tab.document = {};
				} else if (tab.type == 'channel') {
					tab.document = Channels.findOne({_id: tab.key});
				} else {
					tab.document = Tabs.findOne({_id: tab.key});
				}
				// get the document

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

App.prototype.mouseEnter = function(e, t) {
	Application.timein = Meteor.setTimeout(function() {
		$('#tab-' + t.data.key + ' .overlay-bar').slideDown('fast');
	}, 500);
	// create a timer to slide the overlay bar down

	Meteor.clearTimeout(Application.timeout);
};

App.prototype.mouseLeave = function(e, t) {
	Application.timeout = Meteor.setTimeout(function() {
		$('#tab-' + t.data.key + ' .overlay-bar').slideUp('fast');
	}, 500);
	// create a timer to slide the overlay bar up

	Meteor.clearTimeout(Application.timein);
};
// -------------------------------------

Application = new App();