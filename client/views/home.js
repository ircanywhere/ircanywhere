var focusEmail = function (e, t) {
		if (e.target.value == 'Email Address')
			e.target.value = '';
	},
	blurEmail = function (e, t) {
		if (e.target.value == '')
			e.target.value = 'Email Address';
	};

Template.login.events({
	'focus input#login-email': focusEmail,
	'focus input#reset-email': focusEmail,
	'blur input#login-email': blurEmail,
	'blur input#reset-email': blurEmail,

	'focus input#login-password': function (e, t) {
		if (e.target.value == 'Password')
			e.target.value = '';
	},

	'blur input#login-password': function (e, t) {
		if (e.target.value == '')
			e.target.value = 'Password';
	},

	'click a#forgot-password-link': function (e, t) {
		$('#forgot-password,#forgot-password-actions').toggle();

		return false;
	},

	'submit form#login-form': function (e, t) {
		e.preventDefault();

		var username = t.find('#login-email').value,
			password = t.find('#login-password').value;
		// retrieve input fields

		username = username.replace(/^\s*|\s*$/g, "");
		// validation

		Meteor.loginWithPassword(username, password, function (err) {
			if (err) {
				t.find('#login-error').show();
				// it seems there was an error, possibly user not found
				// or password was incorrect, lets notify the user
			}
			else {
				t.find('#login-error').hide();
				// the user has been logged in
			}
		});
		// supply the appropriate fields to the
        // Meteor.loginWithPassword() function

        return false;
	}
});

Template.signup.events({
	'submit form#signup-form': function(e, t) {
		e.preventDefault();

		var name = t.find('#your-name').value,
			nickname = t.find('#irc-nickname').value,
			email = t.find('#email-address').value,
			password = t.find('#password').value;

		var email = Helpers.trimInput(email);

		
	}
});