Template.login.created = function() {
	Session.set('login.errors', '');
	Session.set('login.resetErrors', '');
	Session.set('login.resetSuccess', '');
	Session.set('login.forgotPasswordBox', false);
	// reset ALL our session variables relating to this module
};

Template.login.forgotPassword = function() {
	return (Session.get('login.forgotPasswordBox')) ? 'show' : 'hide';
};

Template.login.errors = function() {
	return Session.get('login.errors');
};

Template.login.resetErrors = function() {
	return Session.get('login.resetErrors');
};

Template.login.resetSuccess = function() {
	return Session.get('login.resetSuccess');
};

Template.login.events({
	'focus input#login-email': function (e, t) {
		if (e.target.value == 'Email Address')
			e.target.value = '';
	},

	'focus input#reset-email': function (e, t) {
		if (e.target.value == 'Email Address')
			e.target.value = '';
	},

	'blur input#login-email': function (e, t) {
		if (e.target.value == '')
			e.target.value = 'Email Address';
	},

	'blur input#reset-email': function (e, t) {
		if (e.target.value == '')
			e.target.value = 'Email Address';
	},

	'focus input#login-password': function (e, t) {
		if (e.target.value == 'Password')
			e.target.value = '';
	},

	'blur input#login-password': function (e, t) {
		if (e.target.value == '')
			e.target.value = 'Password';
	},

	'click a#forgot-password-link': function (e, t) {
		Session.set('login.forgotPasswordBox', !Session.get('login.forgotPasswordBox'));
		return false;
	},

	'submit form#login-form': function(e, t) {
		e.preventDefault();
		// prevent the submit straight away
		
		var email = t.find('#login-email').value,
			password = t.find('#login-password').value;
		// retrieve input fields

		email = Meteor.Helpers.trimInput(email);
		// validation

		Meteor.loginWithPassword(email, password, function (err) {
			if (err) {
				Session.set('login.errors', err.reason);
				// it seems there was an error, possibly user not found
				// or password was incorrect, lets notify the user
			} else {
				Session.set('login.errors', '');

				Meteor.call('onUserLogin');
				Router.go('/');
				// the user has been logged in
			}
		});
		// supply the appropriate fields to the
        // Meteor.loginWithPassword() function
	},

	'submit form#reset-form': function(e, t) {
		e.preventDefault();
		// prevent the submit straight away

		var email = t.find('#reset-email');
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
		});
		// request a password reset link
	}
});