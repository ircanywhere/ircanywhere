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

	autoCompleteChar: function() {
		return this.get('socket.users.0.profile.autoCompleteChar') || ',';
	}.property('socket.users.0.profile.autoCompleteChar'),

	nick: function() {
		return this.get('controllers.network.model.nick');
	}.observes('controllers.network.model.nick').property('controllers.network.model.nick').cacheable(),

	actions: {
		resetTabCompletion: function() {
			this.tabCompletionNicks = [];
			this.set('tabCompletionIndex', 0);
		},
		
		sendCommand: function() {
			var tab = this.get('socket.tabs').findBy('selected', true),
				split = this.get('inputValue').split(' '),
				command = split[0],
				commandObject = {
					command: this.get('inputValue'),
					network: tab.network,
					target: tab.target
				};

			if (command.substr(0, 1) === '/' && this.commands[command]) {
				this.commands[command].call(this, tab, split.slice(1));
			} else {
				this.socket.send('sendCommand', commandObject);
				// unlike the last codebase
			}

			commandObject.timestamp = +new Date();
			this.get('socket.commands').pushObject(commandObject);
			// we push it into the buffer manually, saves us getting the data sent back down
			// through the pipe which is a waste of bandwidth

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

			if (this.tabCompletionNicks.length === 0) {
				this.set('originalInputValue', this.get('inputValue'));
			}

			this.tabCompletionNicks = [];
			users.forEach(function(user) {
				var regex = new RegExp('^' + Helpers.escape(lastWord) + '(.*)', 'i');

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
				input[input.length - 1] = (input.length === 1) ? currentNick + this.get('autoCompleteChar') + ' ' : currentNick;
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
	},

	commands: {
		'/clear': function(tab, params) {
			var socketEngine = this.get('socket');

			socketEngine._deleteWhere('events', {network: tab.networkName, target: tab.target});
		}
	}
});

App.injectController('input');