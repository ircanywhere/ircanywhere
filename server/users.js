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
	helper = require('../lib/helpers').Helpers;

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

	application.ee.on('ready', function() {
		fibrous.run(self.init.bind(self));
	});
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
		smtp = application.config.email.smtp.split(/(^smtp\:\/\/|\:|\@)/);
		this.server = emails.server.connect({
			user: smtp[2], 
			password: smtp[4], 
			host: smtp[6], 
			ssl: true
		});
	// setup email server

	application.app.post('/api/register', function(req, res) {
		var response = self.registerUser(req, res);

		res.header('Content-Type', 'application/json');
		res.end(JSON.stringify(response));
	});

	application.app.post('/api/login', function(req, res) {
		var response = self.userLogin(req, res);

		res.header('Content-Type', 'application/json');
		res.end(JSON.stringify(response));
	});

	application.app.get('/api/logout', function(req, res) {
		var response = self.userLogout(req, res);

		res.redirect(307, application.config.url);
		res.end();
	});

	application.app.post('/api/forgot', function(req, res) {
		var response = self.forgotPassword(req, res);

		res.header('Content-Type', 'application/json');
		res.end(JSON.stringify(response));
	});

	application.app.post('/api/reset', function(req, res) {
		var response = self.resetPassword(req, res);

		res.header('Content-Type', 'application/json');
		res.end(JSON.stringify(response));
	});

	application.app.post('/api/settings/updatesettings', function(req, res) {
		var response = self.updateSettings(req, res);

		res.header('Content-Type', 'application/json');
		res.end(JSON.stringify(response));
	});

	application.app.post('/api/settings/changepassword', function(req, res) {
		var response = self.changePassword(req, res);

		res.header('Content-Type', 'application/json');
		res.end(JSON.stringify(response));
	});
	// setup routes
}

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
							(client.internal.status === 'connected' || client.internal.status === 'connecting'));
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
}

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
 * @return {Object}
 */
UserManager.prototype.isAuthenticated = function(data) {
	var parsed = (data) ? data.split('; ') : [],
		cookies = {};

	parsed.forEach(function(cookie) {
		var split = cookie.split('=');
			cookies[split[0]] = split[1];
	});
	// get our cookies

	if (!cookies.token) {
		return false;
	}

	var query = {};
		query['tokens.' + cookies.token] = {$exists: true};
	var user = application.Users.sync.findOne(query);

	if (!user) {
		return false;
	}

	if (new Date() > user.tokens[cookies.token].time) {
		var unset = {};
			unset['tokens.' + cookies.token] = 1;
		
		application.Users.update(query, {$unset: unset}, {safe: false});
		// token is expired, remove it

		return false;
	} else {
		return user;
	}
	// validate the cookie and return user or false
}

/**
 * Handles user registrations, it takes req and res objects from express at the moment
 * however it should probably stay this way, because the api to register a user is at /api/register.
 * I can't see a reason to change this to take individual parameters.
 *
 * @method registerUser
 * @param {Object} req A valid request object from express
 * @param {Object} res A valid response object from express
 * @return {Object} An output object for the API call
 */
UserManager.prototype.registerUser = function(req, res) {
	var name = req.param('name', ''),
		nickname = req.param('nickname', ''),
		email = req.param('email', ''),
		password = req.param('password', ''),
		confirmPassword = req.param('confirmPassword', ''),
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
	}

	if (output.errors.length > 0) {
		output.failed = true;
		return output;
	}
	// any errors?

	var userCount = application.Users.sync.find().sync.count() + 1,
		salt = helper.generateSalt(10),
		user = {
			email: email,
			password: crypto.createHmac('sha256', salt).update(password).digest('hex'),
			salt: salt,
			tokens: {},
			ident: application.config.clientSettings.userNamePrefix + userCount,
			newUser: true,
			selectedTab: '',
			profile: {
				name: name,
				nickname: nickname
			}
		};
	// the user record

	var find = application.Users.sync.find({email: email}).sync.toArray();
	if (find.length > 0) {
		output.failed = true;
		output.errors.push({error: 'The email you have used is already in use'});

		return output;
	} else {
		application.Users.sync.insert(user);
	}
	// it's failed, lets bail

	application.logger.log('info', 'account created', helper.cleanObjectIds(_.cloneDeep(user)));
	// log this event

	var message = {
		text: this.parse('./private/emails/signup.txt', {name: name}),
		from: application.config.email.from,
		to: email,
		subject: 'Welcome to ' + application.config.email.siteName
	};
	
	this.server.send(message);
	// send a email

	networkManager.addNetwork(user, _.clone(application.config.defaultNetwork), networkManager.flags.closed);
	// create a network for them

	output.successMessage = 'Your account has been successfully created, you may now login';
	return output;
}

/**
 * Handles the login call to /api/login and sets an appropriate cookie if successful.
 *
 * @method userLogin
 * @param {Object} req A valid request object from express
 * @param {Object} res A valid response object from express
 * @return {Object} An output object for the API call
 */
UserManager.prototype.userLogin = function(req, res) {
	var email = req.param('email', ''),
		password = req.param('password', ''),
		token = helper.generateSalt(25),
		expire = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)),
		output = {failed: false, successMessage: '', errors: []},
		user = application.Users.sync.findOne({email: email});

	if (!user) {
		output.failed = true;
		output.errors.push({error: 'User not found'});
		return output;
	}

	var salt = user.salt,
		hash = crypto.createHmac('sha256', salt).update(password).digest('hex');

	if (req.cookies.token && _.find(user.tokens, {key: req.cookies.token}) !== undefined) {
		output.successMessage = 'Login successful';
		return output;
	}

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

		application.Users.update({email: email}, {$set: {tokens: tokens, newUser: false}}, {safe: false});
		res.cookie('token', token, {expires: expire});
		// set a login key and a cookie

		this.onUserLogin(user, user.newUser);
	}
	// check if password matches

	return output;
}

/**
 * Handles the call to /api/logout which is self explanatory.
 * 
 * @method userLogout
 * @param {Object} req A valid request object from express
 * @param {Object} res A valid response object from express
 * @return {Object} An output object for the API call
 */
UserManager.prototype.userLogout = function(req, res) {
	var user = this.isAuthenticated(req.headers.cookie);

	if (!user) {
		return false;
	} else {
		application.Users.update({_id: user._id}, {$set: {tokens: {}}}, {safe: false});
		return true;
	}
}

/**
 * Handles the call to /api/forgot to send a forgot password link
 * 
 * @method forgotPassword
 * @param {Object} req A valid request object from express
 * @param {Object} res A valid response object from express
 * @return {Object} An output object for the API call
 */
UserManager.prototype.forgotPassword = function(req, res) {
	var output = {failed: false, successMessage: '', errors: []},
		email = req.param('email', ''),
		token = helper.generateSalt(25),
		expire = new Date(Date.now() + (24 * 60 * 60 * 1000)),
		user = application.Users.sync.findOne({email: email});

	if (!user) {
		output.failed = true;
		output.errors.push({error: 'User not found'});
		return output;
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
			text: this.parse('./private/emails/reset.txt', {name: user.name, link: link}),
			from: application.config.email.from,
			to: email,
			subject: 'Your new password'
		};
	
	this.server.send(message);
	// send a email

	output.successMessage = 'Instructions on how to reset your password have been sent';
	return output;
}

/**
 * Handles the call to /api/reset which will be called when the reset password link is visited
 * Checking is done to make sure a token exists in a user record.
 * 
 * @method resetPassword
 * @param {Object} req A valid request object from express
 * @param {Object} res A valid response object from express
 * @return {Object} An output object for the API call
 */
UserManager.prototype.resetPassword = function(req, res) {
	var password = req.param('password', ''),
		confirmPassword = req.param('confirmPassword', ''),
		token = req.param('token', ''),
		time = new Date(Date.now()),
		user = application.Users.sync.findOne({'resetToken.token': token, 'resetToken.time': {$lte: new Date(Date.now() + (24 * 60 * 60 * 1000))}});

	return this.updatePassword(user, password, confirmPassword);
}

/**
 * Handles the call to /api/settings/updatesettings which will update the settings for that user
 * checking for authentication and validating if necessary.
 *
 * @method updateSettings
 * @param {Object} req A valid request object from express
 * @param {Object} res A valid response object from express
 * @return {Object} An output object for the API call
 */
UserManager.prototype.updateSettings = function(req, res) {
	var name = req.param('name', ''),
		nickname = req.param('nickname', ''),
		email = req.param('email', ''),
		emailUser = application.Users.sync.findOne({email: email}),
		user = this.isAuthenticated(req.headers.cookie),
		output = {failed: false, successMessage: '', errors: []};

	if (!user) {
		output.failed = true;
		output.errors.push({error: 'Not authenticated'});
		return output;
	}

	name = helper.trimInput(name);
	nickname = helper.trimInput(nickname);
	email = helper.trimInput(email);
	// trim output

	if (name === '' || nickname === '' || email === '') {
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
		return output;
	}
	// any errors?

	application.Users.update({_id: user._id}, {$set: {'profile.name': name, 'profile.nickname': nickname, email: email}}, {safe: false});
	// update the settings

	output.successMessage = 'Your settings successfully have been updated.';
	return output;
}

/**
 * Handles the call to /api/settings/changepassword which is almost identical to resetPassword
 * however it checks for authentication and then changes the password using that user, it doesn't
 * take a token though.
 * 
 * @method resetPassword
 * @param {Object} req A valid request object from express
 * @param {Object} res A valid response object from express
 * @return {Object} An output object for the API call
 */
UserManager.prototype.changePassword = function(req, res) {
	var password = req.param('password', ''),
		newPassword = req.param('newPassword', ''),
		user = this.isAuthenticated(req.headers.cookie);

	return this.updatePassword(user, newPassword, newPassword, password);
}

/**
 * Updates a users password, doesn't bypass any checkings, just doesn't
 * define how you select the user, so via a token or direct user object
 * 
 * @method updatePassword
 * @param {Object} user A valid user object from `isAuthenticated`
 * @param {String} password The new password to set
 * @param {String} confirmPassword The same password again
 * @param {String} [currentPassword] The current password
 * @return {Object} An output object for the API call
 */
UserManager.prototype.updatePassword = function(user, password, confirmPassword, currentPassword) {
	var currentPassword = currentPassword || '',
		output = {failed: false, successMessage: '', errors: []};

	if (user === null) {
		output.failed = true;
		output.errors.push({error: (currentPassword) ? 'Not authenticated' : 'Invalid reset password url'});
	} else if (currentPassword !== '' && user.password !== crypto.createHmac('sha256', user.salt).update(currentPassword).digest('hex')) {
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
}

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
	var force = force || false,
		userId = me._id; 

	if (me == null) {
		return;
	}

	var networks = application.Networks.sync.find({'internal.userId': userId}).sync.toArray();
	// find user's networks (use fetch cause we're going to manually push to it if no networks exist)

	for (var netId in networks) {
		var network = networks[netId],
			reconnect = false;

		if (network.internal.status !== networkManager.flags.disconnected && force) {
			reconnect = true;
		}

		if (reconnect) {
			networkManager.connectNetwork(network);
		}
	}
	// loop through our networks and connect them if need be

	application.logger.log('info', 'user logged in', {userId: userId.toString()});
	// log this event
}

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

	for (var key in replace) {
		template = template.replace('{{' + key + '}}', replace[key]);
	}

	return template;
}

exports.UserManager = _.extend(UserManager, hooks);