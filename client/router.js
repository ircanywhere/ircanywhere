Router.map(function () {
	
	var before = function() {
		if (!Meteor.user()) {
			this.render('login');
			this.stop();
			// stop what we're doing and show the user the login template
		}
	}
	// this function is basically a blocker which will send the user back
	// to the homepage template when they're not logged in.

	this.route('home', {
		path: '/',
		template: 'login',
		layoutTemplate: 'index'
	});

	this.route('signup', {
		path: '/signup',
		template: 'signup',
		layoutTemplate: 'index',
		data: {
			signupOpen: Meteor.settings.public.enableRegistrations
		}
	});
});