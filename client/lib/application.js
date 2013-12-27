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
	if (Meteor.user()) {
		Meteor.subscribe('networks', Meteor.user()._id, function() {
			Deps.autorun(tabEngine.getNetworks.bind(tabEngine));
		});
		Meteor.subscribe('tabs', Meteor.user()._id);
		Meteor.subscribe('channels', Meteor.user()._id);
		Meteor.subscribe('channelUsers', Meteor.user()._id);
		Meteor.subscribe('events', Meteor.user()._id);
	}
	// this function handles the subscriptions
};
// -------------------------------------

Application = new App();