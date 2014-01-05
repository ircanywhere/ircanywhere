Nodes = new Meteor.Collection('nodes');
Networks = new Meteor.Collection('networks');
Tabs = new Meteor.Collection('tabs');
ChannelUsers = new Meteor.Collection('channelUsers');
Events = new Meteor.Collection('events');
Commands = new Meteor.Collection('commands');
// There is a slight difference between channels and tabs although at client side
// they are both treated as tabs, just channel tabs have more detail. They are both
// stored in network.internal.tabs and are published on different channels
// tabs are for privmsg windows that we want to keep open between browser closes, etc.
// maybe other neater things in the future.