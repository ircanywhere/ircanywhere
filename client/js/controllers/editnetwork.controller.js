App.EditnetworkController = Ember.ObjectController.extend({
	needs: ['network'],

	title: 'Edit Network',
	network: {},

	networkId: '',
	server: '',
	secure: false,
	port: '6667',
	sasl: false,
	saslUsername: '',
	password: '',
	nick: '',
	name: '',

	errors: [],

	networkChanged: function() {
		var network = this.get('controllers.network.model');
		this.set('network', network);

		this.set('networkId', network._id);
		this.set('server', network.server);
		this.set('secure', network.secure);
		this.set('port', network.port.toString());
		this.set('sasl', network.sasl);
		this.set('saslUsername', network.saslUsername || '');
		this.set('password', network.password);
		this.set('nick', network.nick);
		this.set('name', network.realname);
	}.observes('controllers.network.model.nick'),

	actions: {
		close: function() {
			this.set('errors', []);

			return this.send('closeModal');
		},

		networkSubmit: function() {
			var self = this;
			
			Ember.$.post('/api/editnetwork', this.getProperties('networkId', 'server', 'secure', 'port', 'sasl', 'saslUsername', 'password', 'nick', 'name'), function(data) {
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

App.injectController('editnetwork');