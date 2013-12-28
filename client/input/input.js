// ----------------------------
// Template.input
// - the input bar, this is unique per tab

Template.input.created = function() {
	var variableName = 'bufferTS.' + this.data.key;
	Session.set(variableName, 0);
};

Template.input.rendered = function() {
	var inp = this.find('input');
	
	inp.focus();
	inp.selectionEnd = inp.selectionStart;
};

Template.input.lastCommand = function(t) {
	var variableName = 'bufferTS.' + this.key,
		command = Commands.findOne({network: this.networkId, target: this.target, timestamp: {$lt: Session.get(variableName)}}, {sort: {'timestamp': -1}});
	
	if (command === undefined) {
		Session.set(variableName, 0);
		return '';
	} else {
		this.lastCommand = command;
		return command.command;
	}
};

Template.input.events({
	'keydown input': function(e, t) {
		var keyCode = e.keyCode || e.which,
			key = {enter: 13, tab: 9, up: 38, down: 40};

		if (keyCode == key.enter) {
			Commands.insert({
				user: Meteor.user()._id,
				command: e.currentTarget.value,
				network: this.networkId,
				target: this.target,
				sent: false
			});
			// wouldn't try changing user to send as other users, doesn't work :3
			// unlike the last codebase, we don't need to piss about with inserting
			// into a buffer or anything, the commands collection does this for us.

			e.currentTarget.value = '';
			// empty the input

			e.preventDefault();
		} else if (keyCode == key.tab) {
			e.preventDefault();
		} else if (keyCode == key.up) {
			var variableName = 'bufferTS.' + t.data.key,
				lastTs = Session.get(variableName);

			Session.set(variableName, (lastTs === 0) ? +new Date() : (this.lastCommand.timestamp - 1));
			// alter the session variable to redraw lastCommand

			e.preventDefault();
		} else if (keyCode == key.down) {

		}
	}
});
// ----------------------------