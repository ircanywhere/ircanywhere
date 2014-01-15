App.ApplicationController = Ember.ObjectController.extend({
	actions: {},
	// set an actions hash just to supress the error, we don't really need to use it here
	
	events: {
		connect: function() {
			
		},

		error: function() {
			this.transitionToRoute('index');
		},

		sync: function(data) {
			console.log(data);
		}
	}
});