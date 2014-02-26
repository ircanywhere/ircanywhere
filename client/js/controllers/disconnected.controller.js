App.DisconnectedController = Ember.ObjectController.extend({
	open: false,

	reconnect: function() {
		this.socket.connect();
	},
	
	actions: {
		openIfClosed: function() {
			if (!this.open) {
				this.set('open', true);
				this.send('openModal', 'disconnected');
				// open the modal

				Ember.run.later(this.reconnect.bind(this), 5000);
				// attempt to reconnect
			}
		},

		closeIfOpen: function() {
			if (this.open) {
				this.set('open', false);
				this.send('closeModal', 'disconnected');
				// close the modal
			}
		}
	}
});