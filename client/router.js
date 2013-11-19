Router.configure({
	layoutTemplate: 'index',
	notFoundTemplate: 'notfound'
});

Router.map(function () {
	
	var before = function(self) {
		if (!Meteor.user()) {
			self.render('login');
			self.stop();
			// stop what we're doing and show the user the login template
		} else {
			Router.go('app');
		}
	}
	// this function is basically a blocker which will send the user back
	// to the homepage template when they're not logged in.

	this.route('home', {
		path: '/',
		layoutTemplate: 'index',
		before: function() { before(this) }		
	});

	this.route('signup', {
		path: '/signup',
		template: 'signup',
		layoutTemplate: 'index',
		data: {
			signupOpen: Meteor.settings.public.enableRegistrations,
			errors: Session.get('signup.errors')
		}
	});

	this.route('verify', {
		path: '/verify-email/:token',
		action: function() { Meteor.Actions.verifyUser(this, this.params['token']) }
	})
});