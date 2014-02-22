App.InputController = Ember.ObjectController.extend({
	needs: ['network', 'tab'],

	commandIndex: 0,
	inputValue: '',

	ready: function() {
		this.set('commandIndex', this.get('socket.commands').length);
	},

	nick: function() {
		return this.get('controllers.network.model.nick');
	}.observes('controllers.network.model.nick').property('controllers.network.model.nick').cacheable(),

	actions: {
		sendCommand: function() {
			var tab = this.get('socket.tabs').findBy('selected', true);

			this.socket.send('sendCommand', {
				command: this.get('inputValue'),
				network: tab.networkName,
				target: tab.target
			});
			// unlike the last codebase, we don't need to piss about with inserting
			// into a buffer or anything, the commands collection does this for us.

			this.set('inputValue', '');
			// reset the input
		},

		toggleUp: function() {
			var index = this.get('commandIndex') - 1,
				command = this.get('socket.commands')[index];

			if (!command) {
				this.set('inputValue', '');
				this.set('commandIndex', this.get('socket.commands').length);
			} else {
				this.set('inputValue', command.command);
				this.set('commandIndex', index);
			}
			// set a new index and lastCommand
		},

		toggleDown: function() {
			var index = this.get('commandIndex') + 1;
				index = (index === (this.get('socket.commands').length + 1)) ? 0 : index;
			var command = this.get('socket.commands').objectAt(index);

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