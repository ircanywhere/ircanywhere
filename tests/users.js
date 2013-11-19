var assert = require('assert');

suite('Users', function() {
	test('Users.registerUser', function (done, server, client) {
		server.eval(function() {
			Meteor.call('registerUser', 'John Smith', 'john.smith@aol.com', '123456', '123456');

			emit('done');
		}).once('done', function() {
			done();
		});

		client.eval(function() {
			Meteor.loginWithPassword('john.smith@aol.com', '123456', function() {
				done();
			});
		});
	});

	
});