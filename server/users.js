UserManager = function() {
	"use strict";

	var _ = require('lodash'),
		crypto = require('crypto'),
		fs = require('fs'),
		hooks = require('hooks'),
		emails = require('emailjs'),
		helper = require('../lib/helpers').Helpers,
		Fiber = require('fibers'),
		_generateSalt = function(string_length) {
			var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz',
				randomstring = '';
			
			for (var i = 0; i < string_length; i++) {
				var rnum = Math.floor(Math.random() * chars.length);
				randomstring += chars.substring(rnum, rnum + 1);
			}

			return randomstring;
		};
		
	var Manager = {
		init: function() {
			application.ee.on('ready', function() {
				var smtp = application.config.email.smtp.split(/(^smtp\:\/\/|\:|\@)/);
				this.server = emails.server.connect({
					user: smtp[2], 
					password: smtp[4], 
					host: smtp[6], 
					ssl: true
				});
				// setup email server

				application.app.post('/api/register', function(req, res) {
					Fiber(function() {
						var response = Manager.registerUser(req, res);

						res.header('Content-Type', 'application/json');
						res.end(JSON.stringify(response));
					}).run();
				});

				application.app.post('/api/login', function(req, res) {
					Fiber(function() {
						var response = Manager.userLogin(req, res);

						res.header('Content-Type', 'application/json');
						res.end(JSON.stringify(response));
					}).run();
				});
				// setup routes
			});
		},

		registerUser: function(req, res) {
			var name = req.param('name', ''),
				nickname = req.param('nickname', ''),
				email = req.param('email', ''),
				password = req.param('password', ''),
				confirmPassword = req.param('confirm-password', ''),
				output = {failed: false, successMessage: '', errors: []};

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

			var salt = _generateSalt(10),
				user = {
					email: email,
					password: crypto.createHmac('sha256', salt).update(password).digest('hex'),
					salt: salt,
					tokens: [],
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
				application.Users.insert(user);
			}
			// it's failed, lets bail

			application.logger.log('info', 'account created', user);
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

		userLogin: function(req, res) {
			var email = req.param('email', ''),
				password = req.param('password', ''),
				token = _generateSalt(25),
				expire = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)),
				output = {failed: false, successMessage: '', errors: []},
				user = application.Users.findOne({email: email});

			if (user === null) {
				output.failed = true;
				output.errors.push({error: 'User not found'});
				// invalid user
			} else {
				var salt = user.salt,
					hash = crypto.createHmac('sha256', salt).update(password).digest('hex');

				if (req.cookies.token && _.find(user.tokens, {key: req.cookies.token}) !== undefined) {
					output.successMessage = 'Login successful';
					// check for a token
				} else {
					if (hash != user.password) {
						output.failed = true;
						output.errors.push({error: 'Password incorrect'});
					} else {
						output.successMessage = 'Login successful';
						// set the output

						var tokens = user.tokens;
							tokens[token] = {
								time: expire,
								ip: req.ip
							};

						application.Users.update({email: email}, {$set: {tokens: tokens}});
						res.cookie('token', token, {expires: expire});
						// set a login key and a cookie

						this.onUserLogin(user);
					}
					// check if password matches
				}
			}

			return output;	
		},

		onUserLogin: function(me) {
			var userId = me._id; 

			if (me == null) {
				return;
			}

			var networks = application.Networks.find({'internal.userId': userId}).toArray();
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

			application.logger.log('info', 'user logged in', {userId: userId.toString()});
			// log this event
		},

		parse: function(file, replace) {
			var template = fs.readFileSync('./private/emails/signup.txt').toString();

			for (var key in replace) {
				template.replace('{{' + key + '}}', replace[key]);
			}

			return template;
		}
	};

	Fiber(Manager.init).run();

	return _.extend(Manager, hooks);
};

exports.UserManager = UserManager;