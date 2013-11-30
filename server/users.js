UserManager = (function() {
	"use strict";

	var Manager = {
		init: function() {
			Accounts.config({
				sendVerificationEmail: Meteor.config.email.forceValidation,
				forbidClientAccountCreation: true
				// set our default accounts config
			});

			Accounts.emailTemplates.siteName = Meteor.config.email.siteName;
			Accounts.emailTemplates.from = Meteor.config.email.from;
			// global email templates settings

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
		}
	};

	Meteor.methods({
		registerUser: function(name, nickname, email, password, confirmPassword) {
			var output = {failed: false, successMessage: '', errors: []},
				userId = null;

			if (!Meteor.config.enableRegistrations) {
				output.errors.push({error: 'New registrations are currently closed'});
			} else {
				name = Meteor.Helpers.trimInput(name);
				nickname = Meteor.Helpers.trimInput(nickname);
				email = Meteor.Helpers.trimInput(email);
				// trim inputs

				if (name == '' || nickname == '' || email == '' || password == '' || confirmPassword == '')
					output.errors.push({error: 'All fields are required'});
				// check if the fields have been entered (all are required)

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
				// some more validation
			}

			if (output.errors.length > 0) {
				output.failed = true;
				return output;
			}
			// seems we have some errors, lets just return them

			try {
				userId = Accounts.createUser({
					email: email,
					password: password,
					profile: {
						name: name,
						nickname: nickname,
						flags: {
							newUser: true
						}
					}
				});
				// try and create the user
			} catch (e) {
				output.failed = true;
				output.errors.push({error: 'The email you have used is already in use'});
				// oh we've caught an error (probably email in use)

				return output;
			}

			if (!Meteor.config.email.forceValidation) {
				output.successMessage = 'Your account has been successfully created, you may now login';
				return output;
			}
			// they don't need validated, lets just proceed by sending a message out

			try {
				Accounts.sendVerificationEmail(userId);
			} catch (e) {
				output.failed = true;
				output.errors.push({error: 'The validation email could not be sent, please contact the site administrator'});

				return output;
			}
			// seems they do need validated, attempt to send an email

			output.successMessage = 'Your account has been successfully created, you will get an email shortly';
			// all has went well

			return output;
		},

		onUserLogin: function() {
			var userId = this.userId,
				me = Meteor.user();

			var networks = Networks.find({'internal.userId': userId}).fetch();
			// find user's networks

			if (me.profile.flags.newUser && networks.length == 0) {
				var network = Meteor.networkManager.addNetwork(me, Meteor.config.defaultNetwork);
				networks.push(network);
			}
			// user is new and has no networks, create one for them.

			for (var netId in networks) {
				var network = networks[netId],
					reconnect = false;

				if (network.internal.status === Meteor.networkManager.flags.closed || network.internal.status === Meteor.networkManager.flags.failed || network.internal.status === Meteor.networkManager.flags.connecting)
					reconnect = true;
				// check whether we should reconnect or not

				if (reconnect)
					Meteor.networkManager.connectNetwork(me, network);
				// ok we've got the go ahead now.
			}
			// loop through our networks and connect them if need be
		}
	});

	return Manager;
}());
// create our user manager object

Meteor.userManager = Object.create(UserManager);
Meteor.userManager.init();