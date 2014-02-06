App.ResetController = Ember.ObjectController.extend({
	title: 'Reset Password - IRCAnywhere',
	
	errors: false,
	success: false,

	password: '',
	confirmPassword: '',

	actions: {
		resetSubmit: function() {
			var self = this;
			
			Ember.$.post('/api/reset', this.getProperties('token', 'password', 'confirmPassword'), function(data) {
				self[(data.failed) ? 'resetFail' : 'resetSuccess'](data);
			}).fail(function(err) {
				self.resetFail(false);
			});
		}
	},

	resetSuccess: function(data) {
		this.set('errors', false);
		this.set('success', data.successMessage);
	},

	resetFail: function(data) {
		this.set('success', false);

		if (!data) {
			this.set('errors', [{error: 'An error has occured, contact your system administrator'}]);
		} else {
			this.set('errors', data.errors);
		}
		// set the errors
	}
});