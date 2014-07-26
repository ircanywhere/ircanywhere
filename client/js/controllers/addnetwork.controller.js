App.AddnetworkController = Ember.ObjectController.extend({
	title: 'Add A Network',
	user: {},

	server: '',
	secure: false,
	port: '6667',
	sasl: false,
	saslUsername: '',
	password: '',
	nick: '',
	name: '',

	errors: [],

	userChanged: function() {
		var user = this.get('user');

		this.set('name', user.profile.name);
		this.set('nick', user.profile.nickname);
		// set some defaults
	}.observes('user'),

	ready: function() {
		this.set('user', this.get('socket.users').objectAt(0));
	},

	actions: {
		close: function() {
			this.set('errors', []);

			return this.send('closeModal');
		},

		networkSubmit: function() {
			var self = this;
			
			Ember.$.post('/api/addnetwork', this.getProperties('server', 'secure', 'port', 'sasl', 'saslUsername', 'password', 'nick', 'name'), function(data) {
				self[(data.failed) ? 'networkFail' : 'networkSuccess'](data);
			}).fail(function() {
				self.networkFail(false);
			});
		}
	},

	networkSuccess: function() {
		this.set('errors', false);
		this.send('closeModal');
	},

	networkFail: function(data) {
		if (!data) {
			this.set('errors', [{error: 'An error has occured, contact your system administrator'}]);
		} else {
			this.set('errors', data.errors);
		}
		// set the errors
	},
});

App.injectController('addnetwork');