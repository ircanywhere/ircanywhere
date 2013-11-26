Router.configure({
	layoutTemplate: 'app',
	notFoundTemplate: 'notfound'
});

Router.map(function () {
	
	var before = function(self) {
		if (!Meteor.user()) {
			self.stop();
			Router.go('/login');
			// stop what we're doing and show the user the login template
		}
	}
	// this function is basically a blocker which will send the user back
	// to the homepage template when they're not logged in.

	this.route('home', {
		path: '/',
		template: 'main',
		before: function() {
			before(this)
		}
	});

	this.route('login', {
		path: '/login',
		template: 'login',
		layoutTemplate: 'index'
	});

	this.route('signup', {
		path: '/signup',
		template: 'signup',
		layoutTemplate: 'index',
		data: {
			title: 'Sign up',
			errors: Session.get('signup.errors')
		}
	});

	this.route('reset', {
		path: '/reset-password/:token',
		template: 'reset',
		layoutTemplate: 'index',
		data: function() {
			var token = this.params['token'];
			return {
				title: 'Reset Password',
				token: token,
				errors: []
			}
		}
	});

	this.route('verify', {
		path: '/verify-email/:token',
		action: function() { Meteor.Actions.verifyUser(this, this.params['token']) }
	});
});