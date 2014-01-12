UserManager = function(application) {
	"use strict";

	var _ = require('lodash'),
		crypto = require('crypto'),
		fs = require('fs'),
		hooks = require('hooks'),
		emails = require('emailjs'),
		helper = require('../lib/helpers').Helpers,
		_generateSalt = function() {
			var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz',
				string_length = 10,
				randomstring = '';
			
			for (var i = 0; i < string_length; i++) {
				var rnum = Math.floor(Math.random() * chars.length);
				randomstring += chars.substring(rnum,rnum + 1);
			}

			return randomstring;
		};
		
	var Manager = {
		init: function() {
			var smtp = application.config.email.smtp.split(/(^smtp\:\/\/|\:|\@)/);
			this.server = emails.server.connect({
				user: smtp[2], 
				password: smtp[4], 
				host: smtp[6], 
				ssl: true
			});

			/*Accounts.config({
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
			};*/
			// override the verify url functions etc to get our own link formats
			// XXX - Re-design
		},

		registerUser: function(name, nickname, email, password, confirmPassword) {
			var output = {failed: false, successMessage: '', errors: []},
				userId = null;

			if (!application.config.enableRegistrations) {
				output.errors.push({error: 'New registrations are currently closed'});
			} else {
				name = helper.trimInput(name);
				nickname = helper.trimInput(nickname);
				email = helper.trimInput(email);

				if (name == '' || nickname == '' || email == '' || password == '' || confirmPassword == '')
					output.errors.push({error: 'All fields are required'});

				if (!helper.isValidName(name))
					output.errors.push({error: 'The name you have entered is too long'});
				if (!helper.isValidNickname(nickname))
					output.errors.push({error: 'The nickname you have entered is invalid'});
				if (!helper.isValidEmail(email))
					output.errors.push({error: 'The email address you have entered is invalid'});
				if (!helper.isValidPassword(password))
					output.errors.push({error: 'The password you have entered is invalid'});
				if (password != confirmPassword)
					output.errors.push({error: 'The passwords you have entered do not match'});
			}

			if (output.errors.length > 0) {
				output.failed = true;
				return output;
			}
			// any errors?

			var salt = _generateSalt(),
				user = {
					email: email,
					password: crypto.createHmac('sha256', salt).update(password).digest('hex'),
					salt: salt,
					profile: {
						name: name,
						nickname: nickname,
						flags: {
							newUser: true
						}
					}
				};
			// the user record

			var find = application.Users.find({email: email}).toArray();
			if (find.length > 0) {
				output.failed = true;
				output.errors.push({error: 'The email you have used is already in use'});

				return output;
			} else {
				userId = application.Users.insert(user);
			}
			// it's failed, lets bail

			application.logger.log('info', 'account created', _.omit(user, '_id'));
			// log this event

			var message = {
				text: this.parse('./private/signup.txt', {name: name}),
				from: application.config.email.from,
				to: email,
				subject: 'Welcome to ' + application.config.email.siteName
			};
			
			this.server.send(message);
			// send a email

			output.successMessage = 'Your account has been successfully created, you may now login';
			return output;
		},

		onUserLogin: function() {
			var userId = this.userId,
				me = Meteor.user(); 

			if (me == null) {
				return;
			}

			var networks = Networks.find({'internal.userId': userId}).fetch();
			// find user's networks (use fetch cause we're going to manually push to it if no networks exist)

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
		},

		getLoggedIn: function() {
			// XXX - Create a function to replace Meteor.user()
		},

		parse: function(file, replace) {
			var template = fs.readFileSync('./private/emails/signup.txt').toString();

			for (var key in replace) {
				template.replace('{{' + key + '}}', replace[key]);
			}

			return template;
		}
	};

	Manager.init();

	return _.extend(Manager, hooks);
};

exports.UserManager = UserManager;