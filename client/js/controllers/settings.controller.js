App.SettingsController = Ember.ObjectController.extend({
	title: 'Settings',
	active: 'settings',

	passwordErrors: [],
	passwordMessage: '',
	password: '',
	newPassword: '',

	showSettingsForm: function() {
		return (this.get('active') === 'settings');	
	}.property('active').cacheable(),

	showPasswordForm: function() {
		return (this.get('active') === 'password');	
	}.property('active').cacheable(),
	
	actions: {
		close: function() {
			this.set('passwordErrors', []);
			this.set('passwordSuccess', '');
			// reset a load of settings
			return this.send('closeModal');
		},

		active: function(tab) {
			this.set('active', tab);
		},

		passwordSubmit: function() {
			var self = this;
			
			Ember.$.post('/api/settings/changepassword', this.getProperties('password', 'newPassword')).then(function(data) {
				self[(data.failed) ? 'passwordFail' : 'passwordSuccess'](data);
			}, this.passwordFail.bind(this));
		}
	},

	passwordSuccess: function(data) {
		this.set('passwordErrors', false);
		this.set('passwordMessage', data.successMessage);
	},

	passwordFail: function(data) {
		this.set('passwordMessage', false);

		if (typeof data === 'undefined') {
			this.set('passwordErrors', ['An error has occured']);
		} else {
			this.set('passwordErrors', data.errors);
		}
		// set the errors
	}
});