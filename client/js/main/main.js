Deps.autorun(function(c) {
	if (Meteor.user()) {
		Meteor.subscribe('networks', Meteor.user()._id);
		Meteor.subscribe('channels', Meteor.user()._id);
		Meteor.subscribe('tabs', Meteor.user()._id);
		Meteor.subscribe('channelUsers', Meteor.user()._id);
		Meteor.subscribe('events', Meteor.user()._id);
	}
});