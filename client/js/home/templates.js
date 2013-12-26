home = Object.create(Home);

Template.login.forgotPassword = function() {
	return (Session.get('login.forgotPasswordBox')) ? 'show' : 'hide';
};

Template.login.errors = function() {
	return Session.get('login.errors');
};

Template.login.resetErrors = function() {
	return Session.get('login.resetErrors');
};

Template.login.resetSuccess = function() {
	return Session.get('login.resetSuccess');
};

Template.signup.errors = function(t) {
	return Session.get('signup.errors');
};

Template.signup.success = function(t) {
	return Session.get('signup.success');
};

Template.reset.errors = function(t) {
	return Session.get('reset.errors');
};

Template.reset.success = function(t) {
	return Session.get('reset.success');
};
// bind all our variables (quite a few huh)

Template.login.events({
	'focus input#login-email': function (e, t) {
		if (e.target.value == 'Email Address')
			e.target.value = '';
	},

	'focus input#reset-email': function (e, t) {
		if (e.target.value == 'Email Address')
			e.target.value = '';
	},

	'blur input#login-email': function (e, t) {
		if (e.target.value == '')
			e.target.value = 'Email Address';
	},

	'blur input#reset-email': function (e, t) {
		if (e.target.value == '')
			e.target.value = 'Email Address';
	},

	'focus input#login-password': function (e, t) {
		if (e.target.value == 'Password')
			e.target.value = '';
	},

	'blur input#login-password': function (e, t) {
		if (e.target.value == '')
			e.target.value = 'Password';
	},

	'click a#forgot-password-link': function (e, t) {
		Session.set('login.forgotPasswordBox', !Session.get('login.forgotPasswordBox'));
		return false;
	},

	'submit form#login-form': function(e, t) {
		e.preventDefault();
		home.loginFormSubmit($('form#login-form').serializeObject());
	},

	'submit form#reset-form': function(e, t) {
		e.preventDefault();
		home.resetFormSubmit($('form#reset-form').serializeObject());
	}
});


Template.signup.events({
	'submit form#signup-form': function(e, t) {
		e.preventDefault();
		home.signupFormSubmit($('form#signup-form').serializeObject());
	}
});

Template.signup.preserve({
	'input#your-name': function(node) {
		return node.id;
	},

	'input#irc-nickname': function(node) {
		return node.id;
	},

	'input#email-address': function(node) {
		return node.id;
	},
});

Template.reset.events({
	'submit form#reset-password-form': function(e, t) {
		e.preventDefault();
		home.resetPassFormSubmit($('form#reset-password-form').serializeObject());
	}
});
// bind all our events, notice most are submit events which go to functions
// defined in our module.js file, this allows us to write tests for our submits etc
// (WHICH IS REALLY GOOD)
// it also manages to keep out all DOM manipulation outside of module.js, leaving it to us here