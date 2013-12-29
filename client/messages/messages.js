// ----------------------------
// Template.messages
// - everything inside .backlog (this is all the messages)

Template.messages.getMessages = function() {
	return Events.find({tab: this.key});
};

Template.messages.parse = function(json) {
	return JSON.stringify(json, undefined, 2);
};
// ----------------------------