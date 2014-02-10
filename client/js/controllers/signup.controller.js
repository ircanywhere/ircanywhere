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
			
			Ember.$.post('/api/register', this.getProperties('name', 'nickname', 'email', 'password', 'confirmPassword'), function(data) {
				self[(data.failed) ? 'signupFail' : 'signupSuccess'](data);
			}).fail(function(err) {
				self.signupFail(false);
			});
		}
	},

	signupSuccess: function(data) {
		this.set('errors', false);
		this.set('success', data.successMessage);
	},

	signupFail: function(data) {
		this.set('success', false);

		if (!data) {
			this.set('errors', [{error: 'An error has occured, contact your system administrator'}]);
		} else {
			this.set('errors', data.errors);
		}
		// set the errors
	}
});