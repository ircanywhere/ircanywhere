// ----------------------------
// Template.userlist
// - the userlist template

Template.userlist.userCount = function() {
	var name = Networks.findOne({_id: this.network}).name;
	return ChannelUsers.find({network: name, channel: this.target}).count();
};

Template.userlist.users = function() {
	var name = Networks.findOne({_id: this.network}).name;
	return ChannelUsers.find({network: name, channel: this.target}, {sort: {sort: 1, nickname: 1}});
};
// ----------------------------