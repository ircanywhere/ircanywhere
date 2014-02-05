App.SettingsController = Ember.ObjectController.extend({
	title: 'Settings',
	active: 'settings',
	errors: [],
	success: '',

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
			return this.send('closeModal');
		},

		active: function(tab) {
			this.set('active', tab);
		},

		passwordSubmit: function() {
			var self = this;
			
			Ember.$.post('/api/settings/changepass', this.getProperties('password', 'newPassword')).then(function(data) {
				self[(data.failed) ? 'passwordFail' : 'passwordSuccess'](data);
			}, this.passwordFail.bind(this));
		}
	},

	passwordSuccess: function(data) {
		this.set('errors', false);
		this.set('success', data.successMessage);
	},

	passwordFail: function(data) {
		this.set('success', false);

		if (typeof data === 'undefined') {
			this.set('errors', ['An error has occured']);
		} else {
			this.set('errors', data.errors);
		}
		// set the errors
	}
});