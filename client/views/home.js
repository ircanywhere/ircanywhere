Template.login.forgotPassword = function() {
	return (Session.get('login.forgotPasswordBox')) ? 'show' : 'hide';
};

Template.login.errors = function() {
	return Session.get('login.errors');
};

Template.login.resetErrors = function() {
	return Session.get('login.resetErrors');
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
		var current = Session.get('login.forgotPasswordBox');
		Session.set('login.forgotPasswordBox', !current);

		return false;
	},

	'submit form#login-form': function (e, t) {
		e.preventDefault();

		var email = t.find('#login-email').value,
			password = t.find('#login-password').value;
		// retrieve input fields

		email = Meteor.Helpers.trimInput(email);
		// validation

		Meteor.loginWithPassword(email, password, function (err) {
			if (err) {
				Session.set('login.errors', err.reason);
				$(t.find('#login-error')).show();
				// it seems there was an error, possibly user not found
				// or password was incorrect, lets notify the user
			} else {
				$(t.find('#login-error')).hide();
				// the user has been logged in
			}
		});
		// supply the appropriate fields to the
        // Meteor.loginWithPassword() function

        return false;
	},

	'submit form#reset-form': function(e, t) {
		e.preventDefault();

		var email = t.find('#reset-email').value;
		// grab input field

		email = Meteor.Helpers.trimInput(email);
		// validation

		Accounts.forgotPassword({email: email}, function(err) {
			if (err) {
				Session.set('login.resetErrors', err.reason);
				$(t.find('#reset-response')).show();
			}
		});
		// request a password reset link

		return false;
	}
});

Template.signup.yourName = function(t) {
	return Session.get('signup.yourName');
};

Template.signup.ircNickname = function(t) {
	return Session.get('signup.ircNickname');
};

Template.signup.emailAddress = function(t) {
	return Session.get('signup.emailAddress');
};

Template.signup.errors = function(t) {
	return Session.get('signup.errors');
};

Template.signup.success = function(t) {
	return Session.get('signup.success');
};

Template.signup.events({
	'submit form#signup-form': function(e, t) {
		e.preventDefault();

		var name = t.find('#your-name').value,
			nickname = t.find('#irc-nickname').value,
			email = t.find('#email-address').value,
			password = t.find('#password').value,
			confirmPassword = t.find('#confirm-password').value,
			errors = [];
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
				Session.set('signup.errors', []);
				Session.set('signup.success', result.successMessage);
			}
		});
	}
});