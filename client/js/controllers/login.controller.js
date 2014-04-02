App.LoginController = Ember.ObjectController.extend({
	title: 'IRCAnywhere',
	errors: false,

	resetErrors: false,
	resetSent: false,

	forgotPassword: false,
	email: 'Email Address',
	password: 'Password',
	resetEmail: 'Email Address',

	actions: {
		loginSubmit: function() {
			var self = this,
				email = this.get('email'),
				password = this.get('password');
			// retrieve input fields

			email = Helpers.trimInput(email);
			// validation

			Ember.$.post('/api/login', {email: email, password: password}, function(data) {
				self[(data.failed) ? 'loginFail' : 'loginSuccess'](data);
			}).fail(function(err) {
				self.loginFail(false)
			});
			// still stuck using jquery, everything seems to depend on it
			// oh well.
		},

		resetSubmit: function() {
			var self = this,
				email = this.get('resetEmail');

			email = Helpers.trimInput(email);
			// validation

			Ember.$.post('/api/forgot', {email: email}, function(data) {
				self[(data.failed) ? 'resetFail' : 'resetSuccess'](data);
			}).fail(function(err) {
				self.resetFail(false)
			});
		},

		toggleProperty: function() {
			this.toggleProperty('forgotPassword');
		}
	},

	loginSuccess: function(data) {
		this.socket.connect();
		this.set('errors', false);
	},

	loginFail: function(data) {
		if (!data) {
			this.set('errors', 'An error has occured');
		} else {
			this.set('errors', data.errors[0].error);
		}
		// set the errors
	},

	resetSuccess: function(data) {
		this.set('resetErrors', false);
		this.set('resetSent', data.successMessage);
	},

	resetFail: function(data) {
		this.set('resetSent', false);

		if (!data) {
			this.set('resetErrors', 'An error has occured, contact your system administrator');
		} else {
			this.set('resetErrors', data.errors[0].error);
		}
		// set the errors
	}
});