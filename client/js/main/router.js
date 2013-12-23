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
// setup a before callback for all events but these, this will check if we're
// logged in, if not we will be pushed to the login page

Router.map(function () {
	this.route('home', {
		path: '/',
		template: 'main',
		layoutTemplate: 'app'
	});
	// this route will display the app template if we're logged in
	// if not it will display main

	// ===================================
	// the following routes will be displayed when a client
	// is logged out, they're all account related
	//
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
		action: function() {
			Meteor.Actions.verifyUser(this, this.params['token']);
			Meteor.call('onUserLogin');
		}
	});
	// ===================================

	// ===================================
	// the following routes are for logged in functions
	// settings / addnetwork .. etc

	this.route('settings', {
		data: function() {
			return 'null';
		}
	});

	this.route('addnetwork', {
		data: function() {
			return 'null';
		}
	});

	this.route('logout', {
		path: '/logout',
		action: function() {
			Meteor.logout();
		}
	});
	// ===================================

	// ===================================
	// these routes are for networks/channels/lists and other irc related stuff

	this.route('network', {
		path: '/:url',
		data: function() {
			alert(this.params.url);
			return 'null';
		}
	});

	this.route('tab', {
		path: '/:url/:title',
		data: function() {
			alert(this.params.title);
			return 'null';
		}
	});
	// ===================================
});
// define all our router functions here