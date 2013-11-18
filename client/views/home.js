Template.login.visibility = function () {
	return (Session.get('login.forgotpassword')) ? 'hide' : 'show';
};

Template.login.events({
	'focus input#login-username' : function (e, t) {
		if (e.target.value == 'Username or Email Address')
			e.target.value = '';
	},

	'focus input#login-password' : function (e, t) {
		if (e.target.value == 'Password')
			e.target.value = '';
	},

	'focus input#reset-email' : function (e, t) {
		if (e.target.value == 'Email Address')
			e.target.value = '';
	},

	'blur input#reset-email' : function (e, t) {
		if (e.target.value == '')
			e.target.value = 'Email Address';
	},

	'blur input#login-password' : function (e, t) {
		if (e.target.value == '')
			e.target.value = 'Password';
	},

	'click a#forgot-password-link' : function (e, t) {
		var currentStatus = Session.get('login.forgotpassword');
		Session.set('login.forgotpassword', !currentStatus);
		// basically just grab the current status and reverse it to create a toggle effect.

		return false;
	},

	'submit form#login-form': function (e, t) {
		e.preventDefault();

		var username = t.find('#login-username').value,
			password = t.find('#login-password').value;
		// retrieve input fields

		Meteor.loginWithPassword(username, password, function (err) {
			if (err) {
				t.find('#login-error').innerHTML = '<div class="alert-message block-message error">User details incorrect</div>';
				// it seems there was an error, possibly user not found
				// or password was incorrect, lets notify the user
			}
			else {
				// the user has been logged in
			}
		});
		// supply the appropriate fields to the
        // Meteor.loginWithPassword() function

        return false;
	}
});