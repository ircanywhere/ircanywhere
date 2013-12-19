if (Meteor.isClient) {
	Deps.autorun(function(c) {
		if (Session.equals('loggedIn', true)) {
			defineCollections();
		}
	});
} else if (Meteor.isServer) {
	defineCollections();
}

function defineCollections() {
	Nodes = new Meteor.Collection('nodes');
	Networks = new Meteor.Collection('networks');
	Channels = new Meteor.Collection('channels');
	Tabs = new Meteor.Collection('tabs');
	Events = new Meteor.Collection('events');

	// There is a slight difference between channels and tabs although at client side
	// they are both treated as tabs, just channel tabs have more detail. They are both
	// stored in network.internal.tabs and are published on different channels
	// tabs are for privmsg windows that we want to keep open between browser closes, etc.
	// maybe other neater things in the future.
}