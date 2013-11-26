HomeModule = (function() {
	"use strict";

	var Module = {

		init: function() {

			Session.set('login.errors', '');
			Session.set('login.resetErrors', '');
			Session.set('login.resetSuccess', '');
			Session.set('login.forgotPasswordBox', false);
			// reset ALL our session variables relating to this module
		},

		loginFormSubmit: loginFormSubmit,
		resetFormSubmit: resetFormSubmit,
		signupFormSubmit: signupFormSubmit,
		resetPassFormSubmit: resetPassFormSubmit
	};

	return Module;

	function loginFormSubmit(items, callback) {

		var email = items['login-email'],
			password = items['login-password'];
		// retrieve input fields

		email = Meteor.Helpers.trimInput(email);
		// validation

		Meteor.loginWithPassword(email, password, function (err) {
			if (err) {
				Session.set('login.errors', err.reason);
				// it seems there was an error, possibly user not found
				// or password was incorrect, lets notify the user
			} else {
				Session.set('loggedIn', true);
				Session.set('login.errors', '');

				Meteor.call('onUserLogin');
				Router.go('/');
				// the user has been logged in
			}

			if (callback) callback();
		});
		// supply the appropriate fields to the
        // Meteor.loginWithPassword() function
	}

	function resetFormSubmit(items, callback) {

		var email = items['reset-email'];
		// grab input field

		email = Meteor.Helpers.trimInput(email);
		// validation

		Accounts.forgotPassword({email: email}, function(err) {
			if (err) {
				Session.set('login.resetErrors', err.reason);
			} else {
				Session.set('login.resetErrors', '');
				Session.set('login.resetSuccess', 'An email has been sent instructing you how to reset your password');
			}

			if (callback) callback();
		});
		// request a password reset link

		return false;
	}

	function signupFormSubmit(items, callback) {

		var name = items['your-name'],
			nickname = items['irc-nickname'],
			email = items['email-address'],
			password = items['password'],
			confirmPassword = items['confirm-password'];
		// grab all our variables

		Meteor.call('registerUser', name, nickname, email, password, confirmPassword, function(err, result) {
			if (result.failed) {
				Session.set('signup.yourName', name);
				Session.set('signup.ircNickname', nickname);
				Session.set('signup.emailAddress', email);
				Session.set('signup.errors', result.errors);
				Session.set('signup.success', '');
				// reset some fields to keep our user happy
			} else {
				Session.set('signup.errors', '');
				Session.set('signup.success', result.successMessage);
			}

			if (callback) callback();
		});

		return false;
	}

	function resetPassFormSubmit(items, callback) {
		
		var token = items['token'],
			password = items['#password'],
			confirmPassword = items['#confirm-password'],
			errors = [];

		if (password == '' || confirmPassword == '' || token == '')
			errors.push({error: 'All fields are required'});
		if (!Meteor.Helpers.isValidPassword(password))
			errors.push({error: 'The password you have entered is invalid'});
		if (password != confirmPassword)
			errors.push({error: 'The passwords you have entered do not match'});
		// validation

		if (errors.length > 0) {
			Session.set('reset.errors', errors);
			return false;
		}
		// cancel if there are errors

		Accounts.resetPassword(token, password, function(err) {
			if (err) {
				Session.set('reset.errors', [{error: err.reason}]);
			} else {
				Session.set('reset.errors', '');
				Session.set('reset.success', 'Your password has successfully been changed, you may have to login again');
			}

			if (callback) callback();
		});
	}
}());