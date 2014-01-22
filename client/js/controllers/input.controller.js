App.InputController = Ember.ObjectController.extend({
	needs: ['network', 'tab'],

	commands: [],
	commandIndex: 0,
	inputValue: '',

	ready: function() {
		this.set('commands', this.socket.findAll('commands'));
		this.set('commandIndex', this.get('commands').length);
	},

	nick: function() {
		return this.get('controllers.network.model.nick');
	}.observes('controllers.network.model.nick').property('controllers.network.model.nick'),

	actions: {
		sendCommand: function() {
			var tab = this.get('controllers.tab.model');

			this.socket.insert('commands', {
				command: this.get('inputValue'),
				network: tab.networkName,
				target: tab.target,
				backlog: true
			});
			// unlike the last codebase, we don't need to piss about with inserting
			// into a buffer or anything, the commands collection does this for us.

			this.set('inputValue', '');
			// reset the input
		},

		toggleUp: function() {
			var index = this.get('commandIndex') - 1,
				command = this.get('commands')[index];

			if (!command) {
				this.set('inputValue', '');
				this.set('commandIndex', this.get('commands').length);
			} else {
				this.set('inputValue', command.command);
				this.set('commandIndex', index);
			}
			// set a new index and lastCommand
		},

		toggleDown: function() {
			var index = this.get('commandIndex') + 1;
				index = (index === (this.get('commands').length + 1)) ? 0 : index;
			var command = this.get('commands')[index];

			if (!command) {
				this.set('inputValue', '');
				this.set('commandIndex', -1);
			} else {
				this.set('inputValue', command.command);
				this.set('commandIndex', index);
			}
			// set a new index and lastCommand
		}
	}
});