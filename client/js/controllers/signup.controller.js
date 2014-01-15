App.SignupController = Ember.ObjectController.extend({
	title: 'Signup - IRCAnywhere',

	errors: false,
	success: false,

	name: '',
	nickname: '',
	email: '',
	password: '',
	confirmPassword: '',

	actions: {
		signupSubmit: function() {
			var self = this;
			
			$.post('/api/register', this.getProperties('name', 'nickname', 'email', 'password', 'confirmPassword')).then(function(data) {
				self[(data.failed) ? 'signupFail' : 'signupSuccess'](data);
			}, this.signupFail.bind(this));
		}
	},

	signupSuccess: function(data) {
		this.set('errors', false);
		this.set('success', data.successMessage);
	},

	signupFail: function(data) {
		this.set('success', false);

		if (typeof data === 'undefined') {
			this.set('errors', 'An error has occured');
		} else {
			this.set('errors', data.errors);
		}
		// set the errors
	}
});