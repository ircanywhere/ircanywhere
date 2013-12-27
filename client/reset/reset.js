Template.reset.created = function() {
	Session.set('reset.errors', '');
	Session.set('reset.success', '');
};

Template.reset.errors = function(t) {
	return Session.get('reset.errors');
};

Template.reset.success = function(t) {
	return Session.get('reset.success');
};

Template.reset.events({
	'submit form#reset-password-form': function(e, t) {
		e.preventDefault();
		
		var token = t.find('#token'),
			password = t.find('#password'),
			confirmPassword = t.find('#confirm-password'),
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
});