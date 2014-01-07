// ----------------------------
// Template.messages
// - everything inside .backlog (this is all the messages)

Template.messages.getMessages = function() {
	return Events.find({tab: this._id});
};

Template.messages.parseEvent = function() {
	if (this.type == 'privmsg') {
		return Template.message;
	}
};
// ----------------------------