// ----------------------------
// Template.signup
// - the signup page template

Template.signup.created = function() {
	Session.set('signup.errors', '');
	Session.set('signup.success', '');
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
		// prevent submit

		var name = t.find('#your-name').value,
			nickname = t.find('#irc-nickname').value,
			email = t.find('#email-address').value,
			password = t.find('#password').value,
			confirmPassword = t.find('#confirm-password').value;
		// grab all our variables

		Meteor.call('registerUser', name, nickname, email, password, confirmPassword, function(err, result) {
			if (result.failed) {
				Session.set('signup.errors', result.errors);
				Session.set('signup.success', '');
				// reset some fields to keep our user happy
			} else {
				Session.set('signup.errors', '');
				Session.set('signup.success', result.successMessage);
			}
		});
	}
});
// ----------------------------