Nodes = new Meteor.SmartCollection('nodes');
Networks = new Meteor.SmartCollection('networks');
Channels = new Meteor.SmartCollection('channels');
Tabs = new Meteor.SmartCollection('tabs');
Events = new Meteor.SmartCollection('events');

// There is a slight difference between channels and tabs although at client side
// they are both treated as tabs, just channel tabs have more detail. They are both
// stored in network.internal.tabs and are published on different channels
// tabs are for privmsg windows that we want to keep open between browser closes, etc.
// maybe other neater things in the future.