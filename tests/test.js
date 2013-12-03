/*var assert = require('assert');

suite('Client user forms', function() {
	test('speed test', function(done, server, client) { done(); });

	test('register a user through signup form', function(done, server, client) {
		client.eval(function() {
			var homeModule = Object.create(HomeModule);
				homeModule.init();

			homeModule.signupFormSubmit({
				'your-name': 'John Smith',
				'irc-nickname': 'john',
				'email-address': 'john.smith@aol.com',
				'password': '123456',
				'confirm-password': '123456'
			}, function() {
				emit('ready', Session.get('signup.errors'));
			});

		}).once('ready', function(errors) {
			assert.equal(errors, '');
			done();
		});
	});

	test('register a user on the server and attempt to login through form', function(done, server, client) {
		server.eval(function() {
			var output = Meteor.call('registerUser', 'John Smith', 'john', 'john.smith@aol.com', '123456', '123456');
		});

		client.eval(function() {
			var homeModule = Object.create(HomeModule);
				homeModule.init();

			homeModule.loginFormSubmit({'login-email': 'john.smith@aol.com', 'login-password': '123456'}, function() {
				emit('ready', Session.get('login.errors'));
			});

		}).once('ready', function(errors) {
			assert.equal(errors, '');
			done();
		});
	});
});*/