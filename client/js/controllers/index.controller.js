App.IndexController = Ember.ObjectController.extend({
	title: 'IRCAnywhere',
	
	actions: {},
	// set an actions hash just to supress the error, we don't really need to use it here

	attemptConnect: function() {
		if (this.socket.get('socket') === null) {
			this.socket.connect();
		}
	},

	events: {
		connect: function() {
			
		},

		error: function() {
			this.transitionTo('login');
		},

		sync: function(data) {
			console.log(data);
		}
	}
});