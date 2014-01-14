App.IndexController = Ember.ObjectController.extend({
	title: 'IRCAnywhere',
	errors: false,
	loginErrors: '',
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
			}, this.loginFail);
			// still stuck using jquery, everything seems to depend on it
			// oh well.
		},

		resetSubmit: function() {

		},

		forgotPassword: function() {
			this.set('forgotPassword', !this.get('forgotPassword'));
		}
	},

	loginSuccess: function(data) {
		
	},

	loginFail: function(data) {
		this.set('errors', true);
		
		if (typeof data === 'undefined') {
			this.set('loginErrors', 'An error has occured');
		} else {
			this.set('loginErrors', data.errors[0].error);
		}
		// set the errors
	}
});