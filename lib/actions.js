Meteor.Actions = {

	verifyUser: function(self, token) {
		Accounts.verifyEmail(token, function (err) {
			if (err) {
				Session.set('signup.errors', [{error: err.reason}]);
				Router.go('/signup');
				// just send them back to the signup page with an error set
			} else {
				// we're done, send them to the application
			}
		});
	}

};