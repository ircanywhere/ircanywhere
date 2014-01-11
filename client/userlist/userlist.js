// ----------------------------
// Template.userlist
// - the userlist template

Template.userlist.rendered = function() {
	console.log('userlist rendered');
};

Template.userlist.destroyed = function() {
	console.log('userlist destroyed');
};

Template.userlist.userCount = function() {
	var name = Networks.findOne({_id: this.network}, {fields: {name: 1}}).name;
	return ChannelUsers.find({network: name, channel: this.target}).count();
};

Template.userlist.users = function() {
	var name = Networks.findOne({_id: this.network}, {fields: {name: 1}}).name;
	return ChannelUsers.find({network: name, channel: this.target}, {sort: {sort: 1, nickname: 1}});
};
// ----------------------------