App.ResetController = Ember.ObjectController.extend({
	errors: false,
	success: false,

	password: '',
	confirmPassword: '',

	init: function () {
		if (!this.socket.socket) {
			this.socket._loadComplete(true);
		}
	},

	actions: {
		resetSubmit: function() {
			var self = this;
			
			Ember.$.post('/api/reset', this.getProperties('token', 'password', 'confirmPassword'), function(data) {
				self[(data.failed) ? 'resetFail' : 'resetSuccess'](data);
			}).fail(function() {
				self.resetFail(false);
			});
		}
	},

	resetSuccess: function(data) {
		this.set('errors', false);
		this.get('controllers.login').set('success', data.successMessage);
		this.transitionToRoute('login');
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