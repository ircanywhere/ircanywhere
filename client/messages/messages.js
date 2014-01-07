// ----------------------------
// Template.messages
// - everything inside .backlog (this is all the messages)

Template.messages.getMessages = function() {
	if (this.type == 'network') {
		return Events.find({network: this.name, target: null}, {sort: {'message.time': 1}});
	} else {
		//var networkName = Networks.findOne({_id: this.network}).name;
		return Events.find({network: 'freenode', target: this.target}, {sort: {'message.time': 1}});
	}
};

Template.messages.equals = function(type, equals) {
	if (type == equals) {
		return true;
	}
};
// ----------------------------