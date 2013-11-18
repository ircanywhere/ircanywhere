Template.login.events({
	'focus input#login-username' : function (e, t) {
		if ($(e.target).val() == 'Username or Email Address')
			$(e.target).val('');
	},

	'focus input#login-password' : function (e, t) {
		if ($(e.target).val() == 'Password')
			$(e.target).val('');
	},

	'focus input#reset-email' : function (e, t) {
		if ($(e.target).val() == 'Email Address')
			$(e.target).val('');
	},

	'blur input#login-username' : function (e, t) {
		if ($(e.target).val() == '')
			$(e.target).val('Username or Email Address');
	},

	'blur input#login-password' : function (e, t) {
		if ($(e.target).val() == '')
			$(e.target).val('Password');
	},

	'blur input#reset-email' : function (e, t) {
		if ($(e.target).val() == '')
			$(e.target).val('Email Address');
	},

	'click a#forgot-password-link' : function (e, t) {
		t.find('#forgot-password').toggle();

		return false;
	},

	'submit form#login-form': function (e, t) {
		e.preventDefault();

		var username = t.find('#login-username').val(),
			password = t.find('#login-password').val();
		// retrieve input fields

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