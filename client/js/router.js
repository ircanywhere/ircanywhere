Router.configure({
	layoutTemplate: 'index',
	notFoundTemplate: 'notfound'
});

var before = function() {
	if (!Meteor.user()) {
		this.stop();
		Router.go('login');
		// stop what we're doing and show the user the login template
	}
}
// this function is basically a blocker which will send the user back
// to the homepage template when they're not logged in.


Router.before(before, {except: ['login', 'signup', 'reset', 'verify']});

Router.map(function () {
	this.route('home', {
		path: '/',
		template: 'main',
		layoutTemplate: 'app'
	});

	this.route('login', {
		path: '/login',
		layoutTemplate: 'index',
		before: function() {
			if (Meteor.user()) {
				this.stop();
				Router.go('home');
			}
		}
	});

	this.route('signup', {
		path: '/signup',
		template: 'signup',
		data: {
			title: 'Sign up',
			errors: Session.get('signup.errors')
		}
	});

	this.route('reset', {
		path: '/reset-password/:token',
		template: 'reset',
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