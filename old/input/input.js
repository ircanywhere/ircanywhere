// ----------------------------
// Template.input
// - the input bar, this is unique per tab

Template.input.created = function() {
	var variableName = 'bufferTS.' + this.data._id;
	Session.set(variableName, {
		query: {$lt: 0},
		sort: {sort: {'timestamp': -1}}
	});

	this.lastCommand = {timestamp: 0};
};

Template.input.rendered = function() {
	var inp = this.find('input');
	
	inp.focus();
	inp.selectionEnd = 0;
};

Template.input.nick = function() {
	return Networks.findOne({_id: this.network}, {fields: {'nick': 1}}).nick;
};

Template.input.lastCommand = function() {
	var variableName = 'bufferTS.' + this._id,
		variable = Session.get(variableName),
		command = Commands.findOne({network: this.network, target: this.target, timestamp: variable.query}, variable.sort);
	
	if (command === undefined) {
		this.lastCommand = {timestamp: 0};
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
				network: this.network,
				target: this.target,
				sent: false
			});
			// wouldn't try changing user to send as other users, doesn't work :3
			// unlike the last codebase, we don't need to piss about with inserting
			// into a buffer or anything, the commands collection does this for us.

			e.currentTarget.value = '';
			// empty the input

			e.preventDefault();
			// prevent default
		} else if (keyCode == key.tab) {

			e.preventDefault();
			// prevent default
		} else if (keyCode == key.up) {
			var variableName = 'bufferTS.' + this._id,
				newTs = (this.lastCommand.timestamp === 0) ? {$lt: +new Date()} : {$lt: this.lastCommand.timestamp - 1};

			Session.set(variableName, {
				query: newTs,
				sort: {sort: {'timestamp': -1}}
			});

			e.preventDefault();
			// prevent default
		} else if (keyCode == key.down) {
			var variableName = 'bufferTS.' + this._id,
				newTs = (this.lastCommand.timestamp === 0) ? {$gt: 0} : {$gt: this.lastCommand.timestamp + 1};

			Session.set(variableName, {
				query: newTs,
				sort: {sort: {'timestamp': 1}}
			});
			e.preventDefault();
			// prevent default
		}
	}
});
// ----------------------------