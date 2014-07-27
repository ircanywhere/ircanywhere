App.SettingsController = Ember.ObjectController.extend({
	title: 'Settings - Account Settings',
	active: 'settings',
	user: {},

	name: '',
	nickname: '',
	email: '',
	autoCompleteChar: '',
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
		this.set('autoCompleteChar', user.profile.autoCompleteChar);
		// set some settings
	}.observes('user'),

	ready: function() {
		this.set('user', this.get('socket.users').objectAt(0));
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
			this.set('settingsMessage', '');
			this.set('passwordErrors', []);
			this.set('passwordMessage', '');
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
			
			Ember.$.post('/api/settings/updatesettings', this.getProperties('name', 'nickname', 'email', 'autoCompleteChar'), function(data) {
				self[(data.failed) ? 'settingsFail' : 'settingsSuccess'](data);
			}).fail(function() {
				self.settingsFail(false);
			});
		},

		passwordSubmit: function() {
			var self = this;
			
			Ember.$.post('/api/settings/changepassword', this.getProperties('password', 'newPassword'), function(data) {
				self[(data.failed) ? 'passwordFail' : 'passwordSuccess'](data);
			}).fail(function() {
				self.passwordFail(false);
			});
		}
	},

	settingsSuccess: function(data) {
		this.set('settingsErrors', false);
		this.set('settingsMessage', data.successMessage);
	},

	settingsFail: function(data) {
		this.set('settingsMessage', false);

		if (!data) {
			this.set('settingsErrors', [{error: 'An error has occured, contact your system administrator'}]);
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

		if (!data) {
			this.set('passwordErrors', [{error: 'An error has occured, contact your system administrator'}]);
		} else {
			this.set('passwordErrors', data.errors);
		}
		// set the errors
	}
});

App.injectController('settings');