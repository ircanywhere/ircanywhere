App.ResetController = Ember.ObjectController.extend({
	title: 'Reset Password - IRCAnywhere',
	
	errors: false,
	success: false,

	password: '',
	confirmPassword: '',

	actions: {
		resetSubmit: function() {
			var self = this;
			
			$.post('/api/reset', this.getProperties('token', 'password', 'confirmPassword')).then(function(data) {
				self[(data.failed) ? 'resetFail' : 'resetSuccess'](data);
			}, this.resetFail.bind(this));
		}
	},

	resetSuccess: function(data) {
		this.set('errors', false);
		this.set('success', data.successMessage);
	},

	resetFail: function(data) {
		this.set('success', false);

		if (typeof data === 'undefined') {
			this.set('errors', 'An error has occured');
		} else {
			this.set('errors', data.errors);
		}
		// set the errors
	}
});