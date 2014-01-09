// ----------------------------
// Template.messages
// - everything inside .backlog (this is all the messages)

Template.messages.rendered = function() {
	var el = this.find('.inside-backlog'),
		heightChanged = function() {
			console.log('height has changed');
		};

	Meteor.setTimeout(function() {
		new ResizeSensor(el, heightChanged);
	}, 100);
	// XXX - FUCK YOU METEOR. I spent 3 hours debugging this, tearing everything apart to try and
	//       get it to work, and I'm resorting to putting in a timer, onload, ready, nothing works BUT this

	heightChanged();
};

Template.messages.getMessages = function() {
	if (this.type == 'network') {
		return Events.find({network: this.name, target: null}, {sort: {'message.time': 1}});
	} else {
		return Events.find({network: Networks.findOne({_id: this.network}).name, target: this.target}, {sort: {'message.time': 1}});
	}
};
// ----------------------------