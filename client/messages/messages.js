// ----------------------------
// Template.messages
// - everything inside .backlog (this is all the messages)

Template.messages.getMessages = function() {
	return Events.find({tab: this._id}, {sort: {'message.time': -1}});
};

Template.messages.parseEvent = function() {
	//console.log(this);

	return Template[this.type];
};
// ----------------------------