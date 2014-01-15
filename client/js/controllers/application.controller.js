App.ApplicationController = Ember.ObjectController.extend({
	title: 'IRCAnywhere',
	
	actions: {},
	// set an actions hash just to supress the error, we don't really need to use it here

	events: {
		connect: function() {
			console.log('test');
		},

		sync: function(data) {
			console.log(data);
		}
	},
});