var raw = Assets.getText('config.json'),
	config = JSON.parse(JSON.minify(raw));

var validate = Meteor.require('validate'),
	schema = {
		public: {
			pageTitle: { type: 'string' },
			enableRegistrations: { type: 'boolean', required: true }
		},
		server: {
			ssl: { type: 'boolean' },
			email: {
				forceValidation: { type: 'boolean', required: true },
				siteName: { type: 'string' },
				from: { type: 'string', required: true }
			},
			clientSettings: {
				networkLimit: { type: 'number', min: 1, max: 10, required: true },
				networkRestriction: { type: 'string' },
				identPrefix: { type: 'string', required: true }
			},
			defaultNetwork: {
				host: { type: 'string', required: true },
				port: { type: 'number', min: 1, max: 65535, required: true },
				realName: { type: 'string', required: true },
				autoRejoin: { type: 'boolean' },
				autoReconnect: { type: 'boolean' },
				retryCount: { type: 'number', min: 1, max: 20 },
				retryDelay: { type: 'number', min: 1000, max: 60000 },
				secure: { type: 'boolean' },
				channels: { type: 'array', values: { type: 'string' } }
			}
		}
	};
// set up some code to validate our config schema

var data = validate(schema, config, { cast: true });
// attempt to validate our config file

if (Array.isArray(data)) {
	process.exit(1);
} else {
	Meteor.settings = data;
}
// any errors, y/n ?

Meteor.methods({
	getConfig: function() {
		if (Meteor.settings.public === undefined)
			return {}
		else
			return Meteor.settings.public;
		// expose a function to the client that lets us grab the current
		// public config, in the client it'll be assigned to CONFIG, and
		// everything outside of "public" will be inaccessible
	}
});