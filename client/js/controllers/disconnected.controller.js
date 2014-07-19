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

App.injectController('disconnected');