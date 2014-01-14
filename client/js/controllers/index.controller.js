App.IndexController = Ember.ObjectController.extend({
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

			email = exports.Helpers.trimInput(email);
			// validation

			$.post('/api/login', {email: email, password: password}).then(function(data) {
				self[(data.failed) ? 'loginFail' : 'loginSuccess'](data);
			}, this.loginFail.bind(this));
			// still stuck using jquery, everything seems to depend on it
			// oh well.
		},

		resetSubmit: function() {
			var self = this,
				email = this.get('resetEmail');

			email = exports.Helpers.trimInput(email);
			// validation

			$.post('/api/forgot', {email: email}).then(function(data) {
				self[(data.failed) ? 'resetFail' : 'resetSuccess'](data);
			}, this.resetFail.bind(this));
		},

		forgotPassword: function() {
			this.set('forgotPassword', !this.get('forgotPassword'));
		}
	},

	loginSuccess: function(data) {
		this.set('errors', false);
		// XXX - Finish this
	},

	loginFail: function(data) {
		if (typeof data === 'undefined') {
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

		if (typeof data === 'undefined') {
			this.set('resetErrors', 'An error has occured');
		} else {
			this.set('resetErrors', data.errors[0].error);
		}
		// set the errors
	}
});