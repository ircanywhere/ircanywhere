Template.login.create = function () {
	Session.set('forgotPasswordHidden', true);
};

Template.login.visibility = function () {
	return (Session.get('forgotPasswordHidden')) ? 'hide' : 'show';
};

Template.login.events({
	'focus input#login-username' : function (event, template) {
		if (event.target.value == 'Username or Email Address')
			event.target.value = '';
	},

	'focus input#login-password' : function (event, template) {
		if (event.target.value == 'Password')
			event.target.value = '';
	},

	'focus input#reset-email' : function (event, template) {
		if (event.target.value == 'Email Address')
			event.target.value = '';
	},

	'blur input#reset-email' : function (event, template) {
		if (event.target.value == '')
			event.target.value = 'Email Address';
	},

	'blur input#login-password' : function (event, template) {
		if (event.target.value == '')
			event.target.value = 'Password';
	},

	'click a#forgot-password-link' : function (event, template) {
		var currentStatus = Session.get('forgotPasswordHidden');
		Session.set('forgotPasswordHidden', !currentStatus);
		// basically just grab the current status and reverse it to create a toggle effect.

		return false;
	},

	'submit form#login-form': function (event, template) {
		event.preventDefault();

		var username = template.find('#login-username').value,
			password = template.find('#login-password').value;
		// retrieve input fields

		Meteor.loginWithPassword(username, password, function (err) {
			if (err) {
				template.find('#login-error').innerHTML = '<div class="alert-message block-message error">User details incorrect</div>';
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