App.SettingsController = Ember.ObjectController.extend({
	title: 'Settings - Account Settings',
	active: 'settings',
	user: {},

	name: '',
	nickname: '',
	email: '',
	settingsErrors: [],
	settingsMessage: '',

	passwordErrors: [],
	passwordMessage: '',
	password: '',
	newPassword: '',

	userChanged: function() {
		var user = this.get('user');

		this.set('name', user.profile.name);
		this.set('nickname', user.profile.nickname);
		this.set('email', user.email);
		// set some settings
	}.observes('user'),

	ready: function() {
		this.set('user', this.socket.findAll('users')[0]);
	},

	showSettingsForm: function() {
		return (this.get('active') === 'settings');	
	}.property('active').cacheable(),

	showPasswordForm: function() {
		return (this.get('active') === 'password');	
	}.property('active').cacheable(),
	
	actions: {
		close: function() {
			this.set('settingsErrors', []);
			this.set('settingsSuccess', '');
			this.set('passwordErrors', []);
			this.set('passwordSuccess', '');
			// reset a load of settings

			return this.send('closeModal');
		},

		active: function(tab) {
			if (tab === 'settings') {
				this.set('title', 'Settings - Account Settings');
			} else {
				this.set('title', 'Settings - Change Password');
			}

			this.set('active', tab);
		},

		settingsSubmit: function() {
			var self = this;
			
			Ember.$.post('/api/settings/updatesettings', this.getProperties('name', 'nickname', 'email')).then(function(data) {
				self[(data.failed) ? 'settingsFail' : 'settingsSuccess'](data);
			}, this.settingsFail.bind(this));
		},

		passwordSubmit: function() {
			var self = this;
			
			Ember.$.post('/api/settings/changepassword', this.getProperties('password', 'newPassword')).then(function(data) {
				self[(data.failed) ? 'passwordFail' : 'passwordSuccess'](data);
			}, this.passwordFail.bind(this));
		}
	},

	settingsSuccess: function(data) {
		this.set('settingsErrors', false);
		this.set('settingsMessage', data.successMessage);
	},

	settingsFail: function(data) {
		this.set('settingsMessage', false);

		if (typeof data === 'undefined') {
			this.set('settingsErrors', ['An error has occured']);
		} else {
			this.set('settingsErrors', data.errors);
		}
		// set the errors
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