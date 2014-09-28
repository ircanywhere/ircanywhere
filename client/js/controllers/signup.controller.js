App.SignupController = Ember.ObjectController.extend({
	needs: ['login'],

	errors: false,

	name: '',
	nickname: '',
	email: '',
	password: '',
	confirmPassword: '',
	timezoneOffset: new Date().getTimezoneOffset(),

	init: function () {
		if (!this.socket.socket) {
			this.socket._loadComplete(true);
		}
	},

	actions: {
		signupSubmit: function() {
			var self = this;
			
			Ember.$.post('/api/register', this.getProperties('name', 'nickname', 'email', 'password', 'confirmPassword', 'timezoneOffset'), function(data) {
				self[(data.failed) ? 'signupFail' : 'signupSuccess'](data);
			}).fail(function() {
				self.signupFail(false);
			});
		}
	},

	signupSuccess: function(data) {
		this.set('errors', false);
		this.get('controllers.login').set('success', data.successMessage);
		this.transitionToRoute('login');
	},

	signupFail: function(data) {
		if (!data) {
			this.set('errors', [{error: 'An error has occured, contact your system administrator'}]);
		} else {
			this.set('errors', data.errors);
		}
		// set the errors
	}
});