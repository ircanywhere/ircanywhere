// ----------------------------
// Template.messages
// - everything inside .backlog (this is all the messages)

Template.messages.rendered = function() {
	var self = this,
		el = this.find('.inside-backlog'),
		heightChanged = function(tpl, element, parent) {
			var height = parent.scrollHeight - parent.clientHeight,
				pos = parent.scrollTop,
				last = $(element).find('div.row:last'),
				offset = height - pos;
			
			if (offset === last.height() || pos === height) {
				parent.scrollTop = height;
			}
		};
	// some variables

	Meteor.setTimeout(function() {
		new ResizeSensor(el, function() {
			heightChanged(self, el, $(el).parent()[0]);
		});
	}, 100);
	// XXX - FUCK YOU METEOR. I spent 3 hours debugging this, tearing everything apart to try and
	//       get it to work, and I'm resorting to putting in a timer, onload, ready, nothing works BUT this

	heightChanged(this, el, $(el).parent()[0]);
	// call this now to update the scroll bar immediately
};

Template.messages.getMessages = function() {
	if (this.type == 'network') {
		return Events.find({network: this.name, target: null}, {sort: {'message.time': 1}});
	} else {
		return Events.find({network: Networks.findOne({_id: this.network}).name, target: this.target}, {sort: {'message.time': 1}});
	}
};
// ----------------------------