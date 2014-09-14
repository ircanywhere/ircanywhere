/**
 * IRCAnywhere server/users.js
 *
 * @title UserManager
 * @copyright (c) 2013-2014 http://ircanywhere.com
 * @license GPL v2
 * @author Ricki Hastings
*/

var _ = require('lodash'),
	crypto = require('crypto'),
	fs = require('fs'),
	hooks = require('hooks'),
	emails = require('emailjs'),
	helper = require('../lib/helpers').Helpers,
	Q = require('q');

/**
 * Responsible for handling user related actions ie registering, logging in, forgot passwords etc.
 * Most of these actions are triggered via API calls.
 *
 * @class UserManager
 * @method UserManager
 * @return void
 */
function UserManager() {
	var d = new Date(),
		secondsPastHour = (d.getMinutes() * 60) + d.getSeconds(),
		self = this;

	this.intervalId = setInterval(this.timeOutInactive.bind(this), ((60 * 60 * 1000) - (secondsPastHour * 1000)));
	// set our inactivity timeout function to run every hour

	application.ee.on('ready', self.init.bind(self));
}

/**
 * Sets up the API routes and anything else needed by the user manager class.
 * Such as timers and the SMTP connection
 *
 * @method init
 * @return void
 */
UserManager.prototype.init = function() {
	var self = this,
		smtp = application.config.email.smtp.match(/smtp(s)?\/\/(?:([^:@]*)(?::([^@]*))?@)?([^:]+)(?::(.*))?$/);
		this.server = emails.server.connect({
			user:     smtp[2] || '',
			password: smtp[3] || '',
			host:     smtp[4],
			port:     smtp[5] || null,
			ssl:      !!smtp[1]
		});
	// setup email server

	application.app.post('/api/register', function(req, res) {
		self.registerUser(req, res).then(function(response) {
			res.header('Content-Type', 'application/json');
			res.end(JSON.stringify(response));
		});
	});

	application.app.post('/api/login', function(req, res) {
		self.userLogin(req, res).then(function(response) {
			res.header('Content-Type', 'application/json');
			res.end(JSON.stringify(response));
		});
	});

	application.app.get('/api/logout', function(req, res) {
		self.userLogout(req, res).then(function() {
			res.redirect(307, '/');
			res.end();
		});
	});

	application.app.post('/api/forgot', function(req, res) {
		self.forgotPassword(req, res).then(function(response) {
			res.header('Content-Type', 'application/json');
			res.end(JSON.stringify(response));
		});
	});

	application.app.post('/api/reset', function(req, res) {
		self.resetPassword(req, res).then(function(response) {
			res.header('Content-Type', 'application/json');
			res.end(JSON.stringify(response));
		});
	});

	application.app.post('/api/settings/updatesettings', function(req, res) {
		self.updateSettings(req, res).then(function(response) {
			res.header('Content-Type', 'application/json');
			res.end(JSON.stringify(response));
		});
	});

	application.app.post('/api/settings/changepassword', function(req, res) {
		self.changePassword(req, res).then(function(response) {
			res.header('Content-Type', 'application/json');
			res.end(JSON.stringify(response));
		});
	});
	// setup routes
};

/**
 * Responsible for disconnecting any inactive users
 *
 * This function is ran every hour or so, but not perfectly precise, but it shouldn't
 * drift off too much because it re-corrects it self.
 *
 * @method timeOutInactive
 * @return void
 */
UserManager.prototype.timeOutInactive = function() {
	var d = new Date(),
		timeoutDate = new Date(),
		timeout = application.config.clientSettings.activityTimeout,
		secondsPastHour = (d.getMinutes() * 60) + d.getSeconds();

	if (timeout > 0) {
		var updateIds = [];

		timeoutDate.setHours(timeoutDate.getHours() - timeout);
		// alter the date as per configuration

		application.Users.find({lastSeen: {$lt: timeoutDate}}).toArray(function(err, docs) {
			if (err || !docs) {
				return;
			}

			docs.forEach(function(doc) {
				var networks = _.filter(Clients, function(client) {
					return (client.internal.userId.toString() === doc._id.toString() &&
							(client.internal.status === networkManager.flags.connected || client.internal.status === networkManager.flags.connecting));
				});
				// ok we have our inactive users now lets find their networks

				networks.forEach(function(network) {
					networkManager.changeStatus({_id: network._id}, networkManager.flags.disconnected);
					// mark as connecting and mark the tab as active again

					ircFactory.send(network._id, 'disconnect', ['Timed out']);
				});
				// loop through the active networks

				updateIds.push(doc._id);
			});

			application.Users.update({_id: {$in: updateIds}}, {$set: {lastSeen: d}}, {safe: false});
			// re-update the last seen date so we don't see these record again next time	
		});
		// perform our hourly task of looking for invalid users
	}

	clearInterval(this.intervalId);
	this.intervalId = setInterval(this.timeOutInactive.bind(this), ((60 * 60 * 1000) - (secondsPastHour * 1000)));
	// re-set the intervalId to prevent drifting
};

/**
 * Checks the sent in authentication string (should be "token=actualToken")
 * all in string format, this is how it is sent in the authentication command and
 * how it lies as a cookie. It also takes a full cookie string, such as
 * "someKey=1; someOtherKey=2; token=actualToken" and the token will only be parsed and used.
 *
 * Returns a valid user object which can be used to set on the socket for example or
 * HTTP request, returns false if invalid
 *
 * @method isAuthenticated
 * @param {Object} data A valid data object from sock.js
 * @return {promise}
 */
UserManager.prototype.isAuthenticated = function(data) {
	var deferred = Q.defer(),
		parsed = (data) ? data.split('; ') : [],
		cookies = {};
	
	parsed.forEach(function(cookie) {
		var split = cookie.split('=');
			cookies[split[0]] = split[1];
	});
	// get our cookies

	if (!cookies.token) {
		deferred.reject();
		return deferred.promise;
	}

	var query = {};
		query['tokens.' + cookies.token] = {$exists: true};

	application.Users.findOne(query, function(err, user) {
		if (err || !user) {
			deferred.reject(err);
			return;
		}

		if (new Date() > user.tokens[cookies.token].time) {
			var unset = {};
				unset['tokens.' + cookies.token] = 1;

			application.Users.update(query, {$unset: unset}, {safe: false});
			// token is expired, remove it

			deferred.reject();
		} else {
			deferred.resolve(user);
		}
	});

	return deferred.promise;
	// validate the cookie and return promise
};

/**
 * Handles user registrations, it takes req and res objects from express at the moment
 * however it should probably stay this way, because the api to register a user is at /api/register.
 * I can't see a reason to change this to take individual parameters.
 *
 * @method registerUser
 * @param {Object} req A valid request object from express
 * @return {promise} An output object for the API call
 */
UserManager.prototype.registerUser = function(req) {
	var self = this,
		deferred = Q.defer(),
		name = req.param('name', ''),
		nickname = req.param('nickname', ''),
		email = req.param('email', ''),
		password = req.param('password', ''),
		confirmPassword = req.param('confirmPassword', ''),
		timezoneOffset = req.param('timezoneOffset', ''),
		output = {failed: false, successMessage: '', errors: []};

	if (!application.config.enableRegistrations) {
		output.errors.push({error: 'New registrations are currently closed'});
	} else {
		name = helper.trimInput(name);
		nickname = helper.trimInput(nickname);
		email = helper.trimInput(email);

		if (name === '' || nickname === '' || email === '' || password === '' || confirmPassword === '') {
			output.errors.push({error: 'All fields are required'});
		}

		if (!helper.isValidName(name)) {
			output.errors.push({error: 'The name you have entered is too long'});
		}

		if (!helper.isValidNickname(nickname)) {
			output.errors.push({error: 'The nickname you have entered is invalid'});
		}

		if (!helper.isValidEmail(email)) {
			output.errors.push({error: 'The email address you have entered is invalid'});
		}

		if (!helper.isValidPassword(password)) {
			output.errors.push({error: 'The password you have entered is invalid'});
		}

		if (password != confirmPassword) {
			output.errors.push({error: 'The passwords you have entered do not match'});
		}

		if (!helper.isValidTimezoneOffset(timezoneOffset)) {
			timezoneOffset = new Date().getTimezoneOffset();
			// Use server timezone by default.
		}
	}

	if (output.errors.length > 0) {
		output.failed = true;

		deferred.resolve(output);
		return deferred.promise;
	}
	// any errors?

	function errorOccured(msg) {
		output.failed = true;
		output.errors.push({error: msg});

		deferred.resolve(output);
	}

	application.Users.find().count(function(err, userCount) {
		if (err) {
			return errorOccured('An error has occured');
		}

		userCount++;

		var salt = helper.generateSalt(10),
			user = {
				email: email,
				password: crypto.createHmac('sha256', salt).update(password).digest('hex'),
				salt: salt,
				tokens: {},
				ident: application.config.clientSettings.userNamePrefix + userCount,
				newUser: true,
				selectedTab: '',
				timezoneOffset: timezoneOffset,
				profile: {
					name: name,
					nickname: nickname
				}
			};
		// the user record

		application.Users.find({email: email}).toArray(function(err, find) {
			if (err || find.length > 0) {
				return errorOccured((err) ? 'An error has occured' : 'The email you have used is already in use');
			}
			// it's failed, lets bail

			application.Users.insert(user, function(err, docs) {
				if (err) {
					return errorOccured('An error has occured');
				}

				if (docs.length === 0) {
					return errorOccured('Your account was not created, please contact an administrator');
				}

				application.logger.log('info', 'account created', helper.cleanObjectIds(_.cloneDeep(user)));
				// log this event

				var message = {
					text: self.parse('./private/emails/signup.txt', {name: name}),
					from: application.config.email.from,
					to: email,
					subject: 'Welcome to ' + application.config.email.siteName
				};

				self.server.send(message);
				// send a email

				networkManager.addNetwork(user, _.clone(application.config.defaultNetwork), networkManager.flags.closed);
				// create a network for them

				output.successMessage = 'Your account has been successfully created, you may now login';

				deferred.resolve(output);
			});
		});
	});

	return deferred.promise;
};

/**
 * Handles the login call to /api/login and sets an appropriate cookie if successful.
 *
 * @method userLogin
 * @param {Object} req A valid request object from express
 * @param {Object} res A valid response object from express
 * @return {Object} An output object for the API call
 */
UserManager.prototype.userLogin = function(req, res) {
	var self = this,
		deferred = Q.defer(),
		email = req.param('email', ''),
		password = req.param('password', ''),
		token = helper.generateSalt(25),
		expire = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)),
		output = {failed: false, successMessage: '', errors: []};

	application.Users.findOne({email: email}, function(err, user) {
		if (err || !user) {
			output.failed = true;
			output.errors.push({error: 'User not found'});

			deferred.resolve(output);
			return;
		}

		var salt = user.salt,
			hash = crypto.createHmac('sha256', salt).update(password).digest('hex');

		if (hash !== user.password) {
			output.failed = true;
			output.errors.push({error: 'Password incorrect'});
		} else if (req.cookies.token && _.find(user.tokens, {key: req.cookies.token}) || hash === user.password) {
			output.successMessage = 'Login successful';
			// set the output

			var tokens = user.tokens;
				tokens[token] = {
					time: expire,
					ip: req.ip
				};

			application.Users.update({email: email}, {$set: {tokens: tokens, newUser: false}}, {safe: false});
			res.cookie('token', token, {expires: expire});
			// set a login key and a cookie

			self.onUserLogin(user, user.newUser);
		}
		// check if password matches

		deferred.resolve(output);
	});

	return deferred.promise;
};

/**
 * Handles login of IRC server user
 *
 * @param {String} email User email
 * @param {String} password User password
 * @returns {promise}
 */
UserManager.prototype.loginServerUser = function(email, password) {
	var self = this,
		deferred = Q.defer();

	if (!password) {
		deferred.reject('password not specified');
	} else {
		application.Users.findOne({email: email}, function(err, user) {
			if (err || !user) {
				deferred.reject('User ' + email + ' not found');
				return;
			}

			var salt = user.salt,
				hash = crypto.createHmac('sha256', salt).update(password).digest('hex');

			if (hash != user.password) {
				deferred.reject('Password incorrect');
				return;
			}
			// check if password matches

			application.Users.update({email: email}, {$set: {newUser: false}}, {safe: false});
			// set newUser

			self.onUserLogin(user, user.newUser);

			deferred.resolve(user);
		});
	}

	return deferred.promise;
};

/**
 * Handles the call to /api/logout which is self explanatory.
 *
 * @method userLogout
 * @param {Object} req A valid request object from express
 * @return {promise} An output object for the API call
 */
UserManager.prototype.userLogout = function(req) {
	var deferred = Q.defer();

	this.isAuthenticated(req.headers.cookie)
		.fail(function() {
			deferred.resolve(false);
		})
		.then(function(user) {
			application.Users.update({_id: user._id}, {$set: {tokens: {}}}, {safe: false});

			deferred.resolve(true);
		});

	return deferred.promise;
};

/**
 * Handles the call to /api/forgot to send a forgot password link
 *
 * @method forgotPassword
 * @param {Object} req A valid request object from express
 * @return {promise} An output object for the API call
 */
UserManager.prototype.forgotPassword = function(req) {
	var self = this,
		deferred = Q.defer(),
		output = {failed: false, successMessage: '', errors: []},
		email = req.param('email', ''),
		token = helper.generateSalt(25),
		expire = new Date(Date.now() + (24 * 60 * 60 * 1000));

	application.Users.findOne({email: email}, function(err, user) {
		if (err || !user) {
			output.failed = true;
			output.errors.push({error: 'User not found'});

			deferred.resolve(output);
			return;
		}

		var resetToken = {
			token: token,
			time: expire,
			ip: req.ip
		};

		application.Users.update({email: email}, {$set: {resetToken: resetToken}}, {safe: false});
		// set the reset token

		var link = application.config.url + '/#/reset/' + token,
			message = {
				text: self.parse('./private/emails/reset.txt', {name: user.profile.name, link: link}),
				from: application.config.email.from,
				to: email,
				subject: 'Your new password'
			};

		self.server.send(message);
		// send a email

		output.successMessage = 'Instructions on how to reset your password have been sent';

		deferred.resolve(output);
	});

	return deferred.promise;
};

/**
 * Handles the call to /api/reset which will be called when the reset password link is visited
 * Checking is done to make sure a token exists in a user record.
 *
 * @method resetPassword
 * @param {Object} req A valid request object from express
 * @return {promise} An output object for the API call
 */
UserManager.prototype.resetPassword = function(req) {
	var self = this,
		deferred = Q.defer(),
		password = req.param('password', ''),
		confirmPassword = req.param('confirmPassword', ''),
		token = req.param('token', ''),
		output = {failed: false, successMessage: '', errors: []};

	application.Users.findOne({'resetToken.token': token, 'resetToken.time': {$lte: new Date(Date.now() + (24 * 60 * 60 * 1000))}}, function(err, user) {
		if (err || !user) {
			output.failed = true;
			output.errors.push({error: 'Not authenticated'});

			deferred.resolve(output);
			return;
		}

		output = self.updatePassword(user, password, confirmPassword);

		deferred.resolve(output);
	});

	return deferred.promise;
};

/**
 * Handles the call to /api/settings/updatesettings which will update the settings for that user
 * checking for authentication and validating if necessary.
 *
 * @method updateSettings
 * @param {Object} req A valid request object from express
 * @return {promise} An output object for the API call
 */
UserManager.prototype.updateSettings = function(req) {
	var self = this,
		deferred = Q.defer(),
		name = req.param('name', ''),
		nickname = req.param('nickname', ''),
		email = req.param('email', ''),
		autoCompleteChar = req.param('autoCompleteChar', ''),
		output = {failed: false, successMessage: '', errors: []};

	application.Users.findOne({email: email}, function(err, emailUser) {
		if (err) {
			output.failed = true;
			output.errors.push({error: 'An error has occured'});

			deferred.resolve(output);
			return;
		}

		self.isAuthenticated(req.headers.cookie)
			.fail(function() {
				output.failed = true;
				output.errors.push({error: 'Not authenticated'});

				deferred.resolve(output);
			})
			.then(function(user) {
				name = helper.trimInput(name);
				nickname = helper.trimInput(nickname);
				email = helper.trimInput(email);
				autoCompleteChar = helper.trimInput(autoCompleteChar);
				// trim output

				if (name === '' || nickname === '' || email === '' || autoCompleteChar === '') {
					output.errors.push({error: 'All fields are required'});
				}

				if (!helper.isValidName(name)) {
					output.errors.push({error: 'The name you have entered is too long'});
				}

				if (!helper.isValidNickname(nickname)) {
					output.errors.push({error: 'The nickname you have entered is invalid'});
				}

				if (user.email !== email && emailUser) {
					output.errors.push({error: 'The email address you have entered is already in use'});
				}

				if (!helper.isValidEmail(email)) {
					output.errors.push({error: 'The email address you have entered is invalid'});
				}

				if (output.errors.length > 0) {
					output.failed = true;

					deferred.resolve(output);
					return;
				}
				// any errors?

				application.Users.update({_id: user._id}, {$set: {
					'profile.name': name,
					'profile.nickname': nickname,
					'profile.autoCompleteChar': autoCompleteChar,
					email: email
				}}, {safe: false});
				// update the settings

				output.successMessage = 'Your settings successfully have been updated.';

				deferred.resolve(output);
			});
	});

	return deferred.promise;
};

/**
 * Handles the call to /api/settings/changepassword which is almost identical to resetPassword
 * however it checks for authentication and then changes the password using that user, it doesn't
 * take a token though.
 *
 * @method resetPassword
 * @param {Object} req A valid request object from express
 * @return {promise} An output object for the API call
 */
UserManager.prototype.changePassword = function(req) {
	var self = this,
		deferred = Q.defer(),
		password = req.param('password', ''),
		newPassword = req.param('newPassword', ''),
		output = {failed: false, successMessage: '', errors: []};

	this.isAuthenticated(req.headers.cookie)
		.fail(function() {
			output.failed = true;
			output.errors.push({error: (password) ? 'Not authenticated' : 'Invalid reset password url'});

			deferred.resolve(output);
		})
		.then(function(user) {
			output = self.updatePassword(user, newPassword, newPassword, password);

			deferred.resolve(output);
		});

	return deferred.promise;
};

/**
 * Updates a users password, doesn't bypass any checkings, just doesn't
 * define how you select the user, so via a token or direct user object
 *
 * @method updatePassword
 * @param {promise} user A valid promise object from `isAuthenticated`
 * @param {String} password The new password to set
 * @param {String} confirmPassword The same password again
 * @param {String} [currentPassword] The current password
 * @return {Object} An output object for the API call
 */
UserManager.prototype.updatePassword = function(user, password, confirmPassword, currentPassword) {
	var output = {failed: false, successMessage: '', errors: []};

	currentPassword = currentPassword || '';

	if (currentPassword !== '' && user.password !== crypto.createHmac('sha256', user.salt).update(currentPassword).digest('hex')) {
		output.failed = true;
		output.errors.push({error: 'The password you have entered is invalid'});
	} else if (password === '' || confirmPassword === '') {
		output.failed = true;
		output.errors.push({error: 'All fields are required'});
	} else if (!helper.isValidPassword(password) || !helper.isValidPassword(confirmPassword)) {
		output.failed = true;
		output.errors.push({error: 'The password you have entered must be over 6 characters'});
	} else if (password !== confirmPassword) {
		output.failed = true;
		output.errors.push({error: 'The passwords you have entered do not match'});
	} else {
		var hash = crypto.createHmac('sha256', user.salt).update(password).digest('hex');

		application.Users.update({_id: user._id}, {$unset: {resetToken: 1}, $set: {password: hash}}, {safe: false});
		// set the password && unset any reset tokens

		output.successMessage = 'Your password has been reset, you may now login';
	}

	return output;
};

/**
 * An event which is called when a successful login occurs, this logic is kept out of
 * the handler for /api/login because it's specific to a different section of the application
 * which is the networkManager and ircFactory.
 *
 * @method onUserLogin
 * @param {Object} me A valid user object
 * @param {Boolean} [force] Whether to force the reconnect of a disconnected client
 * @return void
 */
UserManager.prototype.onUserLogin = function(me, force) {
	var userId = me._id;

	force = force || false;

	if (!me) {
		return;
	}

	application.Networks.find({'internal.userId': userId}).each(function(err, network) {
		if (err || !network) {
			return;
		}

		var reconnect = false;

		if (network.internal.status !== networkManager.flags.disconnected && force) {
			reconnect = true;
		}

		if (reconnect) {
			networkManager.connectNetwork(network);
		}
	});
	// find user's networks (use fetch cause we're going to manually push to it if no networks exist)

	application.logger.log('info', 'user logged in', {userId: userId.toString()});
	// log this event
};

/**
 * Looks for a template and parses the {{tags}} into the values in replace
 * and returns a string, used to parse emails. Very basic parsing which will
 * probably be replaced by something more powerful in the future with HTML outputs.
 *
 * @method parse
 * @param {String} file The name of the email template
 * @param {Object} replace A hash of keys and values to replace in the template
 * @return {String} A parsed email template
 */
UserManager.prototype.parse = function(file, replace) {
	var template = fs.readFileSync(file).toString();

	_.each(replace, function(rep, key) {
		template = template.replace('{{' + key + '}}', rep);
	});

	return template;
};

/**
 * Update lastSeen entry of user.
 *
 * @param {String} userId Id of the user
 * @param {Date} [lastSeen] New lastSeen value
 */
UserManager.prototype.updateLastSeen = function (userId, lastSeen) {
	var timestamp = lastSeen || new Date();

	application.Users.update({_id: userId}, {$set: {lastSeen: timestamp}}, {safe: false});
};

UserManager.prototype = _.extend(UserManager.prototype, hooks);

exports.UserManager = UserManager;
