UserManager = function() {
	"use strict";

	var Manager = {
		init: function() {
			Accounts.config({
				sendVerificationEmail: application.config.email.forceValidation,
				forbidClientAccountCreation: true
			});

			Accounts.emailTemplates.siteName = application.config.email.siteName;
			Accounts.emailTemplates.from = application.config.email.from;

			Accounts.urls.resetPassword = function (token) {
				return Meteor.absoluteUrl('reset-password/' + token);
			};

			Accounts.urls.verifyEmail = function (token) {
				return Meteor.absoluteUrl('verify-email/' + token);
			};

			Accounts.urls.enrollAccount = function (token) {
				return Meteor.absoluteUrl('enroll-account/' + token);
			};
			// override the verify url functions etc to get our own link formats
		},

		registerUser: function(name, nickname, email, password, confirmPassword) {
			var output = {failed: false, successMessage: '', errors: []},
				userId = null;

			if (!application.config.enableRegistrations) {
				output.errors.push({error: 'New registrations are currently closed'});
			} else {
				name = Meteor.Helpers.trimInput(name);
				nickname = Meteor.Helpers.trimInput(nickname);
				email = Meteor.Helpers.trimInput(email);

				if (name == '' || nickname == '' || email == '' || password == '' || confirmPassword == '')
					output.errors.push({error: 'All fields are required'});

				if (!Meteor.Helpers.isValidName(name))
					output.errors.push({error: 'The name you have entered is too long'});
				if (!Meteor.Helpers.isValidNickname(nickname))
					output.errors.push({error: 'The nickname you have entered is invalid'});
				if (!Meteor.Helpers.isValidEmail(email))
					output.errors.push({error: 'The email address you have entered is invalid'});
				if (!Meteor.Helpers.isValidPassword(password))
					output.errors.push({error: 'The password you have entered is invalid'});
				if (password != confirmPassword)
					output.errors.push({error: 'The passwords you have entered do not match'});
			}

			if (output.errors.length > 0) {
				output.failed = true;
				return output;
			}
			// any errors?

			var user = {
				email: email,
				password: password,
				profile: {
					name: name,
					nickname: nickname,
					flags: {
						newUser: true
					}
				}
			};
			// the user record

			try {
				userId = Accounts.createUser(user);
				delete user.password;
			} catch (e) {
				output.failed = true;
				output.errors.push({error: 'The email you have used is already in use'});

				return output;
			}
			// it's failed, lets bail

			if (!application.config.email.forceValidation) {
				output.successMessage = 'Your account has been successfully created, you may now login';
				return output;
			}

			application.logger.log('info', 'account created', user);
			// log this event

			try {
				Accounts.sendVerificationEmail(userId);
			} catch (e) {
				output.failed = true;
				output.errors.push({error: 'The validation email could not be sent, please contact the site administrator'});

				return output;
			}
			// did we send the email?

			output.successMessage = 'Your account has been successfully created, you will get an email shortly';

			return output;
		},

		onUserLogin: function() {
			var userId = this.userId,
				me = Meteor.user();

			if (me == null) {
				return;
			}

			var networks = Networks.find({'internal.userId': userId}).fetch();
			// find user's networks

			if (me.profile.flags.newUser && networks.length === 0) {
				var network = networkManager.addNetwork(me, application.config.defaultNetwork);
				networks.push(network);
			}
			// user is new and has no networks, create one for them.

			for (var netId in networks) {
				var network = networks[netId],
					reconnect = false;

				if (network.internal.status !== networkManager.flags.disconnect) {
					reconnect = true;
				}

				if (reconnect) {
					networkManager.connectNetwork(me, network);
				}
			}
			// loop through our networks and connect them if need be

			application.logger.log('info', 'user logged in', {userId: userId});
			// log this event
		}
	};

	Meteor.methods({
		registerUser: Manager.registerUser,
		onUserLogin: Manager.onUserLogin
	});
	// open these methods up to the client side

	Manager.init();

	return Manager;
};