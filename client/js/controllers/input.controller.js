App.InputController = Ember.ObjectController.extend({
	needs: ['network', 'tab'],

	commandIndex: 0,
	inputValue: '',
	originalInputValue: '',
	tabCompletionNicks: [],
	tabCompletionIndex: 0,

	ready: function() {
		this.set('commandIndex', this.get('socket.commands').length);
	},

	nick: function() {
		return this.get('controllers.network.model.nick');
	}.observes('controllers.network.model.nick').property('controllers.network.model.nick').cacheable(),

	actions: {
		resetTabCompletion: function() {
			this.tabCompletionNicks = [];
		},
		
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

		tabComplete: function() {
			var self = this,
				input = (this.tabCompletionNicks.length === 0) ? this.get('inputValue').split(/\s+/) : this.get('originalInputValue').split(/\s+/),
				lastWord = input[input.length - 1],
				tab = this.get('socket.tabs').findBy('selected', true),
				users = this.socket.find('channelUsers', {network: tab.networkName, channel: tab.target});

			if (lastWord.trim() === '') {
				return false;
			}

			console.log(input, lastWord);

			if (this.tabCompletionNicks.length === 0) {
				this.set('originalInputValue', this.get('inputValue'));
			}

			this.tabCompletionNicks = [];
			users.forEach(function(user) {
				var regex = new RegExp('^' + exports.Helpers.escape(lastWord) + '(.*)', 'i');

				if (user.nickname.match(regex)) {
					self.tabCompletionNicks.push(user.nickname);
				}
			});
			// match users against our current input

			var currentNick = this.tabCompletionNicks[this.tabCompletionIndex];
			
			if (!currentNick) {
				this.set('tabCompletionIndex', 0);
			} else {
				this.incrementProperty('tabCompletionIndex');
				//currentNick = this.tabCompletionNicks[0];
			}
			// look for a nick on the index

			if (!currentNick) {
				this.set('inputValue', this.get('originalInputValue'));
			} else {
				input[input.length - 1] = (input.length === 1) ? currentNick + ', ' : currentNick;
				this.set('inputValue', input.join(' '));
			}
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